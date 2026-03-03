from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.api import deps
from app.core import database
from app.models.models import PurchaseOrder, PurchaseOrderItem, RawMaterial, User, Supplier, PurchaseOrderStatus, UserRole
from app.schemas.schemas import POCreate, POResponse

router = APIRouter()

@router.get("/", response_model=List[POResponse])
async def get_purchase_orders(
    supplier_id: int = None,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    query = db.query(PurchaseOrder).options(
        joinedload(PurchaseOrder.supplier),
        joinedload(PurchaseOrder.items).joinedload(PurchaseOrderItem.raw_material)
    )
    
    if supplier_id:
        query = query.filter(PurchaseOrder.supplier_id == supplier_id)
        
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        query = query.filter(PurchaseOrder.branch_id == current_user.branch_id)
        
    orders = query.all()
    
    result = []
    for order in orders:
        res = {
            "id": order.id,
            "supplier_id": order.supplier_id,
            "supplier_name": order.supplier.name if order.supplier else "Unknown",
            "status": order.status,
            "total_amount": order.total_amount,
            "created_at": order.created_at,
            "branch_id": order.branch_id,
            "items": [
                {
                    "id": item.id,
                    "raw_material_id": item.raw_material_id,
                    "raw_material_name": item.raw_material.name if item.raw_material else "Unknown",
                    "quantity": item.quantity,
                    "unit_price": item.unit_price
                }
                for item in order.items
            ]
        }
        result.append(res)
    return result

@router.post("/", response_model=POResponse)
async def create_purchase_order(
    po_in: POCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_manager)
):
    total_amount = sum(item.quantity * item.unit_price for item in po_in.items)
    
    db_po = PurchaseOrder(
        supplier_id=po_in.supplier_id,
        total_amount=total_amount,
        status=PurchaseOrderStatus.PENDING,
        branch_id=current_user.branch_id
    )
    db.add(db_po)
    db.flush()
    
    for item in po_in.items:
        db_item = PurchaseOrderItem(
            purchase_order_id=db_po.id,
            raw_material_id=item.raw_material_id,
            quantity=item.quantity,
            unit_price=item.unit_price
        )
        db.add(db_item)
    
    db.commit()
    db.refresh(db_po)
    
    # Return formatted response
    supplier = db.query(Supplier).filter(Supplier.id == db_po.supplier_id).first()
    return {
        "id": db_po.id,
        "supplier_id": db_po.supplier_id,
        "supplier_name": supplier.name,
        "status": db_po.status,
        "total_amount": db_po.total_amount,
        "created_at": db_po.created_at,
        "branch_id": db_po.branch_id,
        "items": [
            {
                "id": i.id,
                "raw_material_id": i.raw_material_id,
                "raw_material_name": db.query(RawMaterial).filter(RawMaterial.id == i.raw_material_id).first().name,
                "quantity": i.quantity,
                "unit_price": i.unit_price
            }
            for i in db_po.items
        ]
    }

@router.patch("/{po_id}/receive", response_model=POResponse)
async def receive_purchase_order(
    po_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_manager)
):
    db_po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not db_po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    
    deps.check_branch_access(current_user, db_po.branch_id)
    
    if db_po.status == PurchaseOrderStatus.RECEIVED:
        raise HTTPException(status_code=400, detail="Order already received")
    
    # Update stock for each item
    for item in db_po.items:
        material = db.query(RawMaterial).filter(RawMaterial.id == item.raw_material_id).with_for_update().first()
        if material:
            material.stock += item.quantity
    
    db_po.status = PurchaseOrderStatus.RECEIVED
    db.commit()
    db.refresh(db_po)
    
    return {
        "id": db_po.id,
        "supplier_id": db_po.supplier_id,
        "supplier_name": db_po.supplier.name,
        "status": db_po.status,
        "total_amount": db_po.total_amount,
        "created_at": db_po.created_at,
        "branch_id": db_po.branch_id,
        "items": [
            {
                "id": i.id,
                "raw_material_id": i.raw_material_id,
                "raw_material_name": i.raw_material.name,
                "quantity": i.quantity,
                "unit_price": i.unit_price
            }
            for i in db_po.items
        ]
    }

@router.get("/central-procurement")
async def get_central_procurement(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """
    Owner only: Get an aggregated list of low stock items across all branches.
    Useful for central purchasing.
    """
    low_stock_items = db.query(RawMaterial).filter(
        RawMaterial.stock <= RawMaterial.min_level
    ).options(joinedload(RawMaterial.branch), joinedload(RawMaterial.supplier)).all()
    
    # Group by supplier
    procurement_plan = {}
    for item in low_stock_items:
        supplier_id = item.supplier_id or 0
        supplier_name = item.supplier.name if item.supplier else "Unknown Supplier"
        
        if supplier_id not in procurement_plan:
            procurement_plan[supplier_id] = {
                "supplier_name": supplier_name,
                "items": []
            }
        
        procurement_plan[supplier_id]["items"].append({
            "raw_material_id": item.id,
            "raw_material_name": item.name,
            "branch_id": item.branch_id,
            "branch_name": item.branch.name if item.branch else "Unknown",
            "current_stock": item.stock,
            "min_level": item.min_level,
            "shortage": max(0, item.min_level - item.stock)
        })
        
    return list(procurement_plan.values())
