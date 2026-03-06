from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.core import database, security
from app.models.models import User, UserRole
from app.schemas.schemas import UserCreate, UserResponse

router = APIRouter()

@router.get("/staff", response_model=List[UserResponse])
async def get_staff(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Get all staff members for the current branch. Owner/Admin see all."""
    query = db.query(User)
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        query = query.filter(User.branch_id == current_user.branch_id)
        # Don't show the manager themselves or higher roles to the manager
        query = query.filter(User.role == UserRole.CASHIER)
    
    return query.all()

@router.post("/staff", response_model=UserResponse)
async def create_staff(
    user_in: UserCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """
    Managers can create Cashiers for their own branch.
    Owners/Admins can create any user role.
    """
    # Check if username exists
    existing = db.query(User).filter(User.username == user_in.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Enforce role logic
    target_role = user_in.role
    target_branch_id = user_in.branch_id
    
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        # Branch Managers can ONLY create Cashiers for THEIR branch
        target_role = UserRole.CASHIER
        target_branch_id = current_user.branch_id
    
    if not target_branch_id:
        raise HTTPException(status_code=400, detail="Branch ID is required")
        
    hashed_password = security.get_password_hash(user_in.password)
    db_user = User(
        username=user_in.username,
        password_hash=hashed_password,
        role=target_role,
        branch_id=target_branch_id,
        require_password_change=True # New staff should also change password
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/staff/{user_id}")
async def delete_staff(
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """
    Managers can delete Cashiers for their own branch.
    Owners/Admins can delete any user except themselves.
    """
    user_to_delete = db.query(User).filter(User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_to_delete.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        # Branch Managers can ONLY delete Cashiers from THEIR branch
        if user_to_delete.branch_id != current_user.branch_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete users from other branches")
        if user_to_delete.role != UserRole.CASHIER:
            raise HTTPException(status_code=403, detail="Managers can only delete cashiers")
    
    # Check if user owns any branches (only relevant if deleting an owner, but good practice)
    if user_to_delete.role == UserRole.OWNER:
        owned_branches = db.query(Branch).filter(Branch.owner_id == user_to_delete.id).first()
        if owned_branches:
            raise HTTPException(status_code=400, detail="Cannot delete an owner who owns branches. Transfer ownership first.")

    db.delete(user_to_delete)
    db.commit()
    return {"message": "Staff member deleted successfully"}
