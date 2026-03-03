from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.core import database
from app.models.models import Table, User, UserRole
from app.schemas.schemas import TableCreate, TableResponse

router = APIRouter()

@router.get("/", response_model=List[TableResponse])
async def get_tables(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    query = db.query(Table)
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        query = query.filter(Table.branch_id == current_user.branch_id)
    
    tables = query.all()
    
    # Add QR URL placeholder/logic
    # In a real app, this would be the actual URL of the frontend ordering page
    frontend_base_url = "http://localhost:5173" # Update as needed
    
    result = []
    for table in tables:
        res = TableResponse.from_orm(table)
        res.qr_url = f"{frontend_base_url}/order/{table.branch_id}/{table.id}"
        result.append(res)
        
    return result

@router.post("/", response_model=TableResponse)
async def create_table(
    table_in: TableCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_manager)
):
    # Verify manager is creating for their own branch
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        if table_in.branch_id != current_user.branch_id:
            raise HTTPException(status_code=403, detail="Cannot create table for another branch")
            
    db_table = Table(**table_in.dict())
    db.add(db_table)
    db.commit()
    db.refresh(db_table)
    return db_table

@router.delete("/{table_id}")
async def delete_table(
    table_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_manager)
):
    db_table = db.query(Table).filter(Table.id == table_id).first()
    if not db_table:
        raise HTTPException(status_code=404, detail="Table not found")
        
    deps.check_branch_access(current_user, db_table.branch_id)
    
    db.delete(db_table)
    db.commit()
    return {"message": "Table deleted"}
