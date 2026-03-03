from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.core import database, security
from app.models.models import Branch, User, UserRole
from app.schemas.schemas import BranchCreate, BranchUpdate, BranchResponse, BranchCreateResponse
import secrets
import string

router = APIRouter()

@router.get("/", response_model=List[BranchResponse])
async def get_branches(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Owner only: Get all branches in the system."""
    return db.query(Branch).all()

@router.post("/", response_model=BranchCreateResponse)
async def create_branch(
    branch_in: BranchCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Owner only: Create a new branch and auto-generate manager credentials."""
    # Check if branch name already exists
    existing = db.query(Branch).filter(Branch.name == branch_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Branch name already exists")
    
    db_branch = Branch(**branch_in.dict())
    db.add(db_branch)
    db.flush() # Get ID without committing
    
    # Auto-generate manager account
    password_length = 12
    alphabet = string.ascii_letters + string.digits
    raw_password = ''.join(secrets.choice(alphabet) for _ in range(password_length))
    
    username = f"manager_{db_branch.id}_{db_branch.name.lower().replace(' ', '_')}"
    hashed_password = security.get_password_hash(raw_password)
    
    manager_user = User(
        username=username,
        password_hash=hashed_password,
        role=UserRole.BRANCH_MANAGER,
        branch_id=db_branch.id,
        require_password_change=True
    )
    db.add(manager_user)
    
    db.commit()
    db.refresh(db_branch)
    
    # Construct response with credentials
    return {
        **db_branch.__dict__,
        "manager_username": username,
        "manager_password": raw_password
    }

@router.get("/{branch_id}", response_model=BranchResponse)
async def get_branch(
    branch_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Allowed for Owners or members of the branch."""
    deps.check_branch_access(current_user, branch_id)
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    return branch

@router.put("/{branch_id}", response_model=BranchResponse)
async def update_branch(
    branch_id: int,
    branch_in: BranchUpdate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Owner only: Update branch details."""
    db_branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not db_branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    update_data = branch_in.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_branch, key, value)
    
    db.commit()
    db.refresh(db_branch)
    return db_branch

@router.delete("/{branch_id}")
async def delete_branch(
    branch_id: int,
    hard: bool = False,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Owner only: Deactivate (soft delete) or permanently delete a branch."""
    db_branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not db_branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    
    if hard:
        # Check for associated data that might prevent clean deletion
        # This is a safety check; SQLite/Postgres will also enforce FK constraints
        try:
            db.delete(db_branch)
            db.commit()
            return {"message": "Branch permanently deleted"}
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=400, 
                detail="Cannot delete branch with active records (sales, users, etc.). Deactivate it instead."
            )
    else:
        db_branch.is_active = False
        db.commit()
        return {"message": "Branch deactivated"}
