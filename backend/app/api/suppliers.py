from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.core import database
from app.models.models import Supplier, User, UserRole
from app.schemas.schemas import SupplierCreate, SupplierResponse

router = APIRouter()

@router.get("/", response_model=List[SupplierResponse])
async def get_suppliers(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    query = db.query(Supplier)
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        query = query.filter((Supplier.branch_id == current_user.branch_id) | (Supplier.branch_id == None))
    return query.all()

@router.post("/", response_model=SupplierResponse)
async def create_supplier(
    supplier_in: SupplierCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_manager)
):
    supplier_data = supplier_in.dict()
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN] or not supplier_data.get("branch_id"):
        supplier_data["branch_id"] = current_user.branch_id
        
    supplier = Supplier(**supplier_data)
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier

@router.get("/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(
    supplier_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier

@router.put("/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(
    supplier_id: int,
    supplier_in: SupplierCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_manager)
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    deps.check_branch_access(current_user, supplier.branch_id)
    
    update_data = supplier_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(supplier, key, value)
    
    db.commit()
    db.refresh(supplier)
    return supplier

@router.delete("/{supplier_id}")
async def delete_supplier(
    supplier_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_manager)
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    deps.check_branch_access(current_user, supplier.branch_id)
    
    db.delete(supplier)
    db.commit()
    return {"message": "Supplier deleted"}
