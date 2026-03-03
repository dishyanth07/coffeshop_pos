from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime, date
from app.api import deps
from app.core import database
from app.models.models import Sale, SaleItem, Inventory, Product, User, Customer, RawMaterial, ProductRecipe, PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus, UserRole, AuditLog, FraudFlag, SaleStatus, PaymentMethod, SaleSource
from app.schemas.schemas import SaleCreate, SaleResponse, SaleHistoryResponse, SalesStats, CustomerListResponse, CustomerSummaryResponse, SaleVoidRequest
import urllib.parse
import json

router = APIRouter()

@router.get("/customers", response_model=CustomerListResponse)
async def get_customers(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Get a list of all customers with their summary stats.
    """
    branch_filter = None
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        branch_filter = current_user.branch_id

    query = db.query(Customer)
    if branch_filter:
        query = query.filter(Customer.branch_id == branch_filter)
    customers = query.all()
    
    result = []
    for customer in customers:
        # Get stats for each customer, filtered by branch if applicable
        sale_query = db.query(Sale).filter(Sale.customer_id == customer.id)
        if branch_filter:
            sale_query = sale_query.filter(Sale.branch_id == branch_filter)
            
        sales = sale_query.all()
        order_count = len(sales)
        total_spent = sum(s.total_amount for s in sales)
        last_order = sale_query.order_by(Sale.created_at.desc()).first()
        
        result.append({
            "id": customer.id,
            "phone": customer.phone,
            "name": customer.name,
            "order_count": order_count,
            "total_spent": total_spent,
            "last_order_date": last_order.created_at if last_order else None
        })
    
    return {"customers": result}

@router.post("/billing", response_model=SaleResponse)
async def create_sale(
    sale_create: SaleCreate, 
    db: Session = Depends(database.get_db), 
    current_user: User = Depends(deps.get_current_active_user)
):
    # Atomic transaction block
    try:
        total_amount = 0.0
        sale_items_data = []
        raw_material_deductions = {} # To keep track of total deduction per RM
        
        # 1. Validate Product Stock & Raw Materials
        for item in sale_create.items:
            inventory = db.query(Inventory).filter(
                Inventory.product_id == item.product_id,
                Inventory.branch_id == current_user.branch_id
            ).with_for_update().first()
            if not inventory:
                raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found in this branch's inventory")
            
            if inventory.quantity < item.quantity:
                raise HTTPException(status_code=400, detail=f"Insufficient product stock for product {item.product_id}. Available: {inventory.quantity}")
            
            product = db.query(Product).options(
                joinedload(Product.recipe_items),
                joinedload(Product.customizations)
            ).filter(Product.id == item.product_id).first()
            if not product:
                raise HTTPException(status_code=404, detail="Product not found")
            
            # Check recipes (Base product)
            for recipe in product.recipe_items:
                needed = recipe.quantity * item.quantity
                rm = db.query(RawMaterial).filter(RawMaterial.id == recipe.raw_material_id).with_for_update().first()
                if not rm:
                    raise HTTPException(status_code=404, detail=f"Raw material {recipe.raw_material_id} not found")
                
                already_deducted = raw_material_deductions.get(rm.id, 0.0)
                if rm.stock - already_deducted < needed:
                    raise HTTPException(status_code=400, detail=f"Insufficient raw material: {rm.name}. Needed: {needed}, Available: {rm.stock - already_deducted}")
                
                # Accrue deductions
                raw_material_deductions[rm.id] = already_deducted + needed

            # Handle Customizations
            customizations_data = []
            extra_total = 0.0
            if item.customization_ids:
                for cust_id in item.customization_ids:
                    cust = next((c for c in product.customizations if c.id == cust_id), None)
                    if not cust:
                        raise HTTPException(status_code=400, detail=f"Invalid customization {cust_id} for product {product.name}")
                    
                    # Extra price
                    extra_total += cust.extra_price * item.quantity

                    # Inventory for customization
                    if cust.raw_material_id and cust.quantity > 0:
                        needed = cust.quantity * item.quantity
                        rm = db.query(RawMaterial).filter(RawMaterial.id == cust.raw_material_id).with_for_update().first()
                        if not rm:
                             raise HTTPException(status_code=404, detail=f"Raw material {cust.raw_material_id} for customization not found")
                        
                        already_deducted = raw_material_deductions.get(rm.id, 0.0)
                        if rm.stock - already_deducted < needed:
                             raise HTTPException(status_code=400, detail=f"Insufficient raw material for {cust.name}: {rm.name}. Needed: {needed}, Available: {rm.stock - already_deducted}")
                        
                        raw_material_deductions[rm.id] = already_deducted + needed
                    
                    customizations_data.append({
                        "customization_id": cust.id,
                        "price_at_sale": cust.extra_price,
                        "name": cust.name
                    })

            item_total = (product.price * item.quantity) + extra_total
            total_amount += item_total
            
            # Deduct product stock
            inventory.quantity -= item.quantity
            
            # Prepare sale item data
            sale_items_data.append({
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price_at_sale": product.price,
                "product_name": product.name,
                "customizations_data": customizations_data
            })

        # 2. Perform Raw Material Deductions & Auto-Reorder
        for rm_id, deduct_qty in raw_material_deductions.items():
            rm = db.query(RawMaterial).filter(RawMaterial.id == rm_id).with_for_update().first() # Ensure RM is locked for update
            rm.stock -= deduct_qty
            
            # Auto-reorder check
            if rm.stock <= rm.min_level:
                # Check if there is already a PENDING PO for this supplier
                if rm.supplier_id:
                    existing_po = db.query(PurchaseOrder).filter(
                        PurchaseOrder.supplier_id == rm.supplier_id,
                        PurchaseOrder.status == PurchaseOrderStatus.PENDING
                    ).first()
                    
                    if not existing_po:
                        # Create new PO
                        existing_po = PurchaseOrder(
                            supplier_id=rm.supplier_id,
                            status=PurchaseOrderStatus.PENDING,
                            total_amount=0.0,
                            branch_id=current_user.branch_id
                        )
                        db.add(existing_po)
                        db.flush()
                    
                    # Check if material already in PO
                    po_item = db.query(PurchaseOrderItem).filter(
                        PurchaseOrderItem.purchase_order_id == existing_po.id,
                        PurchaseOrderItem.raw_material_id == rm.id
                    ).first()
                    
                    reorder_qty = rm.min_level * 2 # Simple reorder logic: reorder twice the min level
                    if not po_item:
                        po_item = PurchaseOrderItem(
                            purchase_order_id=existing_po.id,
                            raw_material_id=rm.id,
                            quantity=reorder_qty,
                            unit_price=0.0 # Price to be filled by user or from past records
                        )
                        db.add(po_item)
                    else:
                        # Optionally increase quantity if already there? 
                        # For now just leave it if it's already pending.
                        pass
                    
                    # Note: total_amount would need update if we had prices, 
                    # but for auto-gen we might leave it as estimates.

        # 3. Handle Customer
        customer_id = None
        customer = None
        if sale_create.customer_phone:
            customer = db.query(Customer).filter(Customer.phone == sale_create.customer_phone).first()
            if not customer:
                customer = Customer(
                    phone=sale_create.customer_phone, 
                    name=sale_create.customer_name,
                    branch_id=current_user.branch_id
                )
                db.add(customer)
                db.flush()
            elif sale_create.customer_name and not customer.name:
                customer.name = sale_create.customer_name
            
            # Security: If manager/cashier, they should only see customers from their branch or allow cross-branch?
            # Requirement says "Filter data based on logged-in user's branch".
            # For customers, let's keep them branch-specific for now as per the new models.
            customer_id = customer.id

        # 4. Integrate AI Crisis Discounts
        final_discount = sale_create.discount_amount
        final_reason = sale_create.discount_reason

        from app.api import assistant # Import the module to access helper and persistent state
        active_offer = assistant.get_active_offer()
        crisis_discount_pct = active_offer.get('discount_pct', 0)
        
        if crisis_discount_pct > 0:
            ai_discount = total_amount * (crisis_discount_pct / 100)
            if ai_discount > final_discount:
                final_discount = ai_discount
                final_reason = f"AI Crisis Recovery Offer ({int(crisis_discount_pct)}% Off)"

        # 5. Create Sale Record
        db_sale = Sale(
            user_id=current_user.id,
            customer_id=customer_id,
            total_amount=total_amount - final_discount,
            discount_amount=final_discount,
            discount_reason=final_reason,
            payment_method=sale_create.payment_method,
            status=SaleStatus.COMPLETED,
            branch_id=current_user.branch_id,
            amount_received=sale_create.amount_received,
            change_amount=sale_create.change_amount
        )
        db.add(db_sale)
        db.flush() # Generate ID

        # 5. Fraud Detection: Discount Abuse
        discount_percentage = (sale_create.discount_amount / total_amount * 100) if total_amount > 0 else 0
        if discount_percentage > 20.0 or sale_create.discount_amount > 50.0:
            flag = FraudFlag(
                user_id=current_user.id,
                branch_id=current_user.branch_id,
                risk_score=15,
                reason=f"High discount applied: {discount_percentage:.1f}% (₹{sale_create.discount_amount:.2f})"
            )
            db.add(flag)

        # 6. Audit Log: Sale Creation
        audit = AuditLog(
            user_id=current_user.id,
            action="sale_created",
            target_type="sale",
            target_id=db_sale.id,
            details=json.dumps({
                "total": db_sale.total_amount,
                "discount": db_sale.discount_amount,
                "items_count": len(sale_items_data),
                "amount_received": db_sale.amount_received,
                "change_amount": db_sale.change_amount
            }),
            branch_id=current_user.branch_id
        )
        db.add(audit)

        # 7. Create Sale Items
        from app.models.models import SaleItemCustomization
        for item_data in sale_items_data:
            custS_data = item_data.pop("customizations_data")
            prod_name = item_data.pop("product_name") 
            new_item = SaleItem(sale_id=db_sale.id, **item_data)
            db.add(new_item)
            db.flush() # Get new_item.id

            for c_data in custS_data:
                c_name = c_data.pop("name")
                item_cust = SaleItemCustomization(sale_item_id=new_item.id, **c_data)
                db.add(item_cust)
                c_data["name"] = c_name
            
            item_data["product_name"] = prod_name 
            item_data["customizations_data"] = custS_data

        db.commit()
        db.refresh(db_sale)
        
        # 5. Generate WhatsApp URL if customer provided
        whatsapp_url = None
        if customer:
            receipt_text = f"☕ *Power House - Digital Receipt*\n"
            receipt_text += f"Order #{db_sale.id}\n"
            receipt_text += f"Date: {db_sale.created_at.strftime('%Y-%m-%d %H:%M')}\n"
            receipt_text += f"------------------\n"
            for item in sale_items_data:
                receipt_text += f"{item['product_name']} x{item['quantity']} - ₹{item['price_at_sale'] * item['quantity']:.2f}\n"
                for cust in item['customizations_data']:
                    receipt_text += f"  + {cust['name']} (₹{cust['price_at_sale']:.2f}ea)\n"
            receipt_text += f"------------------\n"
            receipt_text += f"*Payment: {db_sale.payment_method.value.upper()}*\n"
            receipt_text += f"*Total: ₹{db_sale.total_amount:.2f}*\n"
            if db_sale.payment_method == PaymentMethod.CASH:
                receipt_text += f"Received: ₹{db_sale.amount_received:.2f}\n"
                receipt_text += f"Change: ₹{db_sale.change_amount:.2f}\n"
            receipt_text += f"------------------\n"
            receipt_text += f"Smart. Simple. Scalable.\n"
            receipt_text += f"Thank you for choosing Power House!"
            
            encoded_text = urllib.parse.quote(receipt_text)
            whatsapp_url = f"https://wa.me/{customer.phone}?text={encoded_text}"

        return {
            "id": db_sale.id,
            "total_amount": db_sale.total_amount,
            "status": db_sale.status.value,
            "discount_amount": db_sale.discount_amount,
            "discount_reason": db_sale.discount_reason,
            "created_at": db_sale.created_at,
            "branch_id": db_sale.branch_id,
            "customer": customer,
            "amount_received": db_sale.amount_received,
            "change_amount": db_sale.change_amount,
            "whatsapp_url": whatsapp_url
        }

    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{sale_id}/void", response_model=SaleResponse)
async def void_sale(
    sale_id: int,
    void_req: SaleVoidRequest,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_manager)
):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
        
    if sale.status == SaleStatus.VOIDED:
        raise HTTPException(status_code=400, detail="Sale already voided")
        
    deps.check_branch_access(current_user, sale.branch_id)
    
    # 1. Update Sale Status
    sale.status = SaleStatus.VOIDED
    sale.void_reason = void_req.void_reason
    sale.voided_at = datetime.now()
    sale.voided_by_id = current_user.id
    
    # 2. Revert Stock (Optional but recommended for consistency)
    for item in sale.items:
        inventory = db.query(Inventory).filter(
            Inventory.product_id == item.product_id,
            Inventory.branch_id == sale.branch_id
        ).first()
        if inventory:
            inventory.quantity += item.quantity
            
    # 3. Fraud Detection: High Value Void
    if sale.total_amount > 100.0:
        flag = FraudFlag(
            user_id=sale.user_id, # Flag the cashier who made the sale
            branch_id=sale.branch_id,
            risk_score=25,
            reason=f"High-value sale voided: ₹{sale.total_amount:.2f} (Voided by {current_user.username})"
        )
        db.add(flag)
        
    # 4. Audit Log
    audit = AuditLog(
        user_id=current_user.id,
        action="sale_voided",
        target_type="sale",
        target_id=sale.id,
        details=json.dumps({"reason": void_req.void_reason, "amount": sale.total_amount}),
        branch_id=sale.branch_id
    )
    db.add(audit)
    
    db.commit()
    db.refresh(sale)
    return sale

@router.get("/history", response_model=SaleHistoryResponse)
async def get_sales_history(
    start_date: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_manager)
):
    """
    Get sales history with optional date filtering.
    """
    query = db.query(Sale)
    
    # Branch Isolation
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        query = query.filter(Sale.branch_id == current_user.branch_id)
    
    # Apply date filters
    if start_date:
        start_datetime = datetime.combine(start_date, datetime.min.time())
        query = query.filter(Sale.created_at >= start_datetime)
    
    if end_date:
        end_datetime = datetime.combine(end_date, datetime.max.time())
        query = query.filter(Sale.created_at <= end_datetime)
    
    # Get all sales
    sales = query.order_by(Sale.created_at.desc()).all()
    
    # Calculate aggregations
    total_sales = sum(sale.total_amount for sale in sales)
    total_orders = len(sales)
    
    # Format sales for response
    sales_list = [
        {
            "id": sale.id,
            "total_amount": sale.total_amount,
            "created_at": sale.created_at,
            "cashier": sale.user.username if sale.user else "Unknown"
        }
        for sale in sales
    ]
    
    return {
        "total_sales": total_sales,
        "total_orders": total_orders,
        "sales": sales_list
    }

@router.get("/customer/{phone}")
async def get_customer_history(
    phone: str,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Get sales history for a specific customer by phone.
    """
    customer = db.query(Customer).filter(Customer.phone == phone).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    sale_query = db.query(Sale).filter(Sale.customer_id == customer.id)
    
    # Branch Isolation
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        sale_query = sale_query.filter(Sale.branch_id == current_user.branch_id)
        
    sales = sale_query.order_by(Sale.created_at.desc()).all()
    
    return {
        "customer": customer,
        "total_spent": sum(sale.total_amount for sale in sales),
        "order_count": len(sales),
        "sales": [
            {
                "id": sale.id,
                "total_amount": sale.total_amount,
                "created_at": sale.created_at,
                "items": [
                    {
                        "product_name": item.product.name,
                        "quantity": item.quantity,
                        "price": item.price_at_sale
                    }
                    for item in sale.items
                ]
            }
            for sale in sales
        ]
    }
