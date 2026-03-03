from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.core import database
from app.models.models import RawMaterial, User, Supplier, UserRole
from app.schemas.schemas import RawMaterialCreate, RawMaterialResponse

router = APIRouter()

@router.get("/", response_model=List[RawMaterialResponse])
async def get_raw_materials(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    query = db.query(RawMaterial)
    
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        query = query.filter(RawMaterial.branch_id == current_user.branch_id)
        
    materials = query.all()
    result = []
    for m in materials:
        res = RawMaterialResponse.from_orm(m)
        if m.supplier:
            res.supplier_name = m.supplier.name
        result.append(res)
    return result

@router.post("/", response_model=RawMaterialResponse)
async def create_raw_material(
    material_in: RawMaterialCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_manager)
):
    material_data = material_in.dict()
    if not material_data.get("branch_id") or current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        material_data["branch_id"] = current_user.branch_id
        
    if not material_data.get("branch_id"):
        raise HTTPException(status_code=400, detail="Branch ID is required")
        
    material = RawMaterial(**material_data)
    db.add(material)
    db.commit()
    db.refresh(material)
    
    res = RawMaterialResponse.from_orm(material)
    if material.supplier:
        res.supplier_name = material.supplier.name
    return res

@router.get("/{material_id}", response_model=RawMaterialResponse)
async def get_raw_material(
    material_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    material = db.query(RawMaterial).filter(RawMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Raw material not found")
    
    deps.check_branch_access(current_user, material.branch_id)
    
    res = RawMaterialResponse.from_orm(material)
    if material.supplier:
        res.supplier_name = material.supplier.name
    return res

@router.put("/{material_id}", response_model=RawMaterialResponse)
async def update_raw_material(
    material_id: int,
    material_in: RawMaterialCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_manager)
):
    material = db.query(RawMaterial).filter(RawMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Raw material not found")
    
    deps.check_branch_access(current_user, material.branch_id)
    
    update_data = material_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(material, key, value)
    
    db.commit()
    db.refresh(material)
    
    res = RawMaterialResponse.from_orm(material)
    if material.supplier:
        res.supplier_name = material.supplier.name
    return res

@router.delete("/{material_id}")
async def delete_raw_material(
    material_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_manager)
):
    material = db.query(RawMaterial).filter(RawMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Raw material not found")
    
    deps.check_branch_access(current_user, material.branch_id)
    
    db.delete(material)
    db.commit()
    return {"message": "Raw material deleted"}
