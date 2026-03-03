from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.api import deps
from app.core import database
from app.models.models import Inventory, Product, User, UserRole, AuditLog
import json
from app.schemas.schemas import InventoryUpdate, InventoryResponse, LowStockItem

router = APIRouter()

@router.get("/", response_model=List[InventoryResponse])
async def read_inventory(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(database.get_db), 
    current_user: User = Depends(deps.get_current_active_user)
):
    query = db.query(Inventory).options(joinedload(Inventory.product))
    
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        query = query.filter(Inventory.branch_id == current_user.branch_id)
        
    inventory_items = query.offset(skip).limit(limit).all()
    
    # Map to response format
    result = []
    for inv in inventory_items:
        result.append({
            "id": inv.id,
            "product_id": inv.product_id,
            "product_name": inv.product.name if inv.product else "Unknown",
            "quantity": inv.quantity,
            "reorder_level": inv.reorder_level,
            "branch_id": inv.branch_id
        })
    return result

@router.post("/{product_id}", response_model=InventoryResponse)
async def update_inventory(
    product_id: int, 
    inventory_update: InventoryUpdate, 
    db: Session = Depends(database.get_db), 
    current_user: User = Depends(deps.get_current_active_user)
):
    inventory = db.query(Inventory).filter(Inventory.product_id == product_id).first()
    if not inventory:
        # Create if not exists, but must check if product exists and user has access
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        deps.check_branch_access(current_user, product.branch_id)
        
        inventory = Inventory(product_id=product_id, quantity=0, branch_id=product.branch_id)
        db.add(inventory)
    else:
        deps.check_branch_access(current_user, inventory.branch_id)
    
    old_qty = inventory.quantity
    if inventory_update.quantity is not None:
        inventory.quantity = inventory_update.quantity
    
    # Audit log: Manual stock adjustment
    if inventory_update.quantity is not None and old_qty != inventory_update.quantity:
        audit = AuditLog(
            user_id=current_user.id,
            action="stock_adjustment",
            target_type="inventory",
            target_id=inventory.id,
            details=json.dumps({
                "product": inventory.product.name if inventory.product else "Unknown",
                "old_qty": old_qty,
                "new_qty": inventory.quantity
            }),
            branch_id=inventory.branch_id
        )
        db.add(audit)
    if inventory_update.reorder_level is not None:
        inventory.reorder_level = inventory_update.reorder_level
    
    db.commit()
    db.refresh(inventory)
    
    return {
        "id": inventory.id,
        "product_id": inventory.product_id,
        "product_name": inventory.product.name if inventory.product else "Unknown",
        "quantity": inventory.quantity,
        "reorder_level": inventory.reorder_level,
        "branch_id": inventory.branch_id
    }

@router.get("/low-stock", response_model=List[LowStockItem])
async def get_low_stock_items(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Get all products with stock below or equal to reorder level.
    """
    query = db.query(Inventory).options(joinedload(Inventory.product)).filter(
        Inventory.quantity <= Inventory.reorder_level
    )
    
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        query = query.filter(Inventory.branch_id == current_user.branch_id)
        
    low_stock = query.all()
    
    result = []
    for inv in low_stock:
        result.append({
            "product_id": inv.product_id,
            "product_name": inv.product.name if inv.product else "Unknown",
            "current_stock": inv.quantity,
            "reorder_level": inv.reorder_level,
            "shortage": inv.reorder_level - inv.quantity
        })
    
    return result
