from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.api import deps
from app.core import database
from app.models.models import CustomerOrder, CustomerOrderItem, Table, Product, Sale, SaleItem, RawMaterial, ProductRecipe, User, UserRole, CustomerOrderStatus, Inventory
from app.schemas.schemas import CustomerOrderCreate, CustomerOrderResponse, CustomerOrderStatusUpdate, SaleResponse, PaymentRequest
from app.models.models import Customer
import urllib.parse
import urllib

router = APIRouter()

@router.post("/", response_model=CustomerOrderResponse)
async def place_customer_order(
    order_in: CustomerOrderCreate,
    db: Session = Depends(database.get_db)
):
    """
    Public endpoint: Allows a guest to place an order from a table.
    """
    # Verify table exists and belongs to the specified branch
    table = db.query(Table).filter(Table.id == order_in.table_id, Table.branch_id == order_in.branch_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found in this branch")
    
    # Calculate total and verify products
    total_amount = 0
    order_items = []
    
    for item in order_in.items:
        product = db.query(Product).filter(Product.id == item.product_id, Product.branch_id == order_in.branch_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        
        total_amount += product.price * item.quantity
        order_items.append(CustomerOrderItem(
            product_id=product.id,
            quantity=item.quantity,
            price_at_order=product.price
        ))
    
    db_order = CustomerOrder(
        table_id=order_in.table_id,
        branch_id=order_in.branch_id,
        status=CustomerOrderStatus.PENDING,
        total_amount=total_amount,
        customer_name=order_in.customer_name,
        customer_phone=order_in.customer_phone,
        items=order_items
    )
    
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    # Return formatted response
    return CustomerOrderResponse(
        id=db_order.id,
        table_id=db_order.table_id,
        branch_id=db_order.branch_id,
        status=db_order.status,
        total_amount=db_order.total_amount,
        created_at=db_order.created_at,
        table_number=table.table_number,
        customer_name=db_order.customer_name,
        customer_phone=db_order.customer_phone,
        items=[
            {
                "id": i.id,
                "product_id": i.product_id,
                "product_name": i.product.name,
                "quantity": i.quantity,
                "price_at_order": i.price_at_order
            }
            for i in db_order.items
        ]
    )

@router.get("/live", response_model=List[CustomerOrderResponse])
async def get_live_orders(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Protected: Get active (non-paid/non-cancelled) orders for the current branch.
    """
    query = db.query(CustomerOrder).options(
        joinedload(CustomerOrder.table),
        joinedload(CustomerOrder.items).joinedload(CustomerOrderItem.product)
    ).filter(
        CustomerOrder.status.in_([CustomerOrderStatus.PENDING, CustomerOrderStatus.PREPARING, CustomerOrderStatus.SERVED])
    )
    
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        query = query.filter(CustomerOrder.branch_id == current_user.branch_id)
        
    orders = query.order_by(CustomerOrder.created_at.desc()).all()
    
    result = []
    for o in orders:
        result.append(CustomerOrderResponse(
            id=o.id,
            table_id=o.table_id,
            table_number=o.table.table_number if o.table else "LIVE",
            branch_id=o.branch_id,
            source=o.source.value if hasattr(o.source, "value") else o.source,
            status=o.status,
            total_amount=o.total_amount,
            created_at=o.created_at,
            customer_name=o.customer_name,
            customer_phone=o.customer_phone,
            items=[
                {
                    "id": i.id,
                    "product_id": i.product_id,
                    "product_name": i.product.name,
                    "quantity": i.quantity,
                    "price_at_order": i.price_at_order
                }
                for i in o.items
            ]
        ))
    return result

@router.patch("/{order_id}/status", response_model=CustomerOrderResponse)
async def update_order_status(
    order_id: int,
    status_update: CustomerOrderStatusUpdate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    db_order = db.query(CustomerOrder).filter(CustomerOrder.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    deps.check_branch_access(current_user, db_order.branch_id)
    
    db_order.status = status_update.status
    db.commit()
    db.refresh(db_order)
    
    # Return same formatted response as above (simplified for brevity)
    return CustomerOrderResponse(
        id=db_order.id,
        table_id=db_order.table_id,
        table_number=db_order.table.table_number if db_order.table else "LIVE",
        branch_id=db_order.branch_id,
        source=db_order.source.value if hasattr(db_order.source, "value") else db_order.source,
        status=db_order.status,
        total_amount=db_order.total_amount,
        created_at=db_order.created_at,
        customer_name=db_order.customer_name,
        items=[] # Simplified
    )

@router.post("/{order_id}/pay", response_model=SaleResponse)
async def finalize_and_pay_order(
    order_id: int,
    payment_in: PaymentRequest,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Finalize order: Convert to Sale, deduct raw materials, and mark as Paid.
    """
    db_order = db.query(CustomerOrder).options(
        joinedload(CustomerOrder.items).joinedload(CustomerOrderItem.product).joinedload(Product.recipe_items)
    ).filter(CustomerOrder.id == order_id).first()
    
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    deps.check_branch_access(current_user, db_order.branch_id)
    
    if db_order.status == CustomerOrderStatus.PAID:
        raise HTTPException(status_code=400, detail="Order already paid")

    # 1. Create/Update Customer record if phone exists
    customer_id = None
    customer = None
    if db_order.customer_phone:
        customer = db.query(Customer).filter(Customer.phone == db_order.customer_phone).first()
        if not customer:
            customer = Customer(phone=db_order.customer_phone, name=db_order.customer_name)
            db.add(customer)
            db.flush()
        elif db_order.customer_name and not customer.name:
            customer.name = db_order.customer_name
        customer_id = customer.id

    # 2. Create Sale record
    db_sale = Sale(
        user_id=current_user.id,
        customer_id=customer_id,
        total_amount=db_order.total_amount,
        branch_id=db_order.branch_id,
        source=db_order.source,
        payment_method=payment_in.payment_method
    )
    db.add(db_sale)
    db.flush() # Get sale ID
    
    # 3. Process Items, Deduct Materials, and Create SaleItems
    receipt_items_data = []
    for item in db_order.items:
        # Deduct Product Inventory (Finished goods)
        inventory = db.query(Inventory).filter(
            Inventory.product_id == item.product_id,
            Inventory.branch_id == db_order.branch_id
        ).with_for_update().first()
        if inventory:
            inventory.quantity -= item.quantity

        # Create SaleItem
        db_sale_item = SaleItem(
            sale_id=db_sale.id,
            product_id=item.product_id,
            quantity=item.quantity,
            price_at_sale=item.price_at_order
        )
        db.add(db_sale_item)
        
        receipt_items_data.append({
            "product_name": item.product.name,
            "quantity": item.quantity,
            "price_at_sale": item.price_at_order
        })

        # Deduct Materials (Ingredients)
        for recipe in item.product.recipe_items:
            material = db.query(RawMaterial).filter(
                RawMaterial.id == recipe.raw_material_id
            ).with_for_update().first()
            
            if material:
                material.stock -= (recipe.quantity * item.quantity)
    
    # 4. Update Order Status
    db_order.status = CustomerOrderStatus.PAID
    
    # 5. Generate WhatsApp URL if customer provided
    whatsapp_url = None
    if customer:
        receipt_text = f"☕ *Power House - Digital Receipt*\n"
        table_info = f" (Table {db_order.table.table_number})" if db_order.table else ""
        receipt_text += f"Order #{db_sale.id}{table_info}\n"
        receipt_text += f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
        receipt_text += f"------------------\n"
        for item in receipt_items_data:
            receipt_text += f"{item['product_name']} x{item['quantity']} - ₹{item['price_at_sale'] * item['quantity']:.2f}\n"
        receipt_text += f"------------------\n"
        receipt_text += f"*Payment: {db_sale.payment_method.value.upper()}*\n"
        receipt_text += f"*Total: ₹{db_order.total_amount:.2f}*\n"
        receipt_text += f"Smart. Simple. Scalable.\n"
        receipt_text += f"Thank you for choosing Power House!"
        
        encoded_text = urllib.parse.quote(receipt_text)
        whatsapp_url = f"https://wa.me/{customer.phone}?text={encoded_text}"

    db.commit()
    db.refresh(db_sale)
    
    # Inject whatsapp_url for the response schema
    db_sale.whatsapp_url = whatsapp_url
    return db_sale
