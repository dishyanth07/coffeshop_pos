from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.api import deps
from app.core import database
from app.models.models import StockTransfer, StockTransferStatus, RawMaterial, User, UserRole, Branch
from app.schemas.schemas import StockTransferCreate, StockTransferResponse

router = APIRouter()

@router.post("/", response_model=StockTransferResponse)
async def create_transfer_request(
    transfer_in: StockTransferCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Request a stock transfer from another branch (to the user's branch).
    Usually requested by a Manager.
    """
    # Source material must exist in the source branch (we'll look it up by name or just assume global RM ID for now?)
    # Requirement says raw_materials table has branch_id. 
    # So we need to find the equivalent RM in the other branch by name.
    
    target_rm = db.query(RawMaterial).filter(RawMaterial.id == transfer_in.raw_material_id).first()
    if not target_rm:
        raise HTTPException(status_code=404, detail="Target raw material not found")
        
    deps.check_branch_access(current_user, target_rm.branch_id)
    
    # We need to find the source branch. In this system, RM is branch-specific.
    # So we are transfering RM_A (Branch 1) to RM_B (Branch 2).
    # Request usually says: "I want 10 units of Coffee Beans from Branch 2".
    # But how do we know which RM ID in Branch 2 is "Coffee Beans"?
    
    # Let's assume the user knows the target branch and the RM name matches.
    source_branch = db.query(Branch).filter(Branch.id == transfer_in.to_branch_id).first() # 'to_branch' in request usually means 'from' where they want it? 
    # Let's clarify: from_branch = sender, to_branch = receiver.
    # request: to_branch_id (sender), raw_material_id (receiver's RM)
    
    # Actually, let's keep it simple: request has from_branch_id, to_branch_id, and raw_material_id (the generic ID or the one in 'from' branch?)
    # Since each branch has its own RM records:
    # 1. User in Branch A requests 10kg sugar from Branch B.
    # 2. We find "Sugar" in Branch B.
    # 3. Create Transfer record.
    
    source_rm = db.query(RawMaterial).filter(
        RawMaterial.name == target_rm.name,
        RawMaterial.branch_id == transfer_in.to_branch_id
    ).first()
    
    if not source_rm:
        raise HTTPException(status_code=404, detail=f"Source branch does not have raw material: {target_rm.name}")

    db_transfer = StockTransfer(
        from_branch_id=transfer_in.to_branch_id,
        to_branch_id=target_rm.branch_id,
        raw_material_id=source_rm.id, # The ID in the SOURCE branch
        quantity=transfer_in.quantity,
        status=StockTransferStatus.PENDING
    )
    db.add(db_transfer)
    db.commit()
    db.refresh(db_transfer)
    
    # Format response
    return _format_transfer(db_transfer, db)

@router.get("/", response_model=List[StockTransferResponse])
async def get_transfers(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """List transfers involving the user's branch."""
    query = db.query(StockTransfer).options(
        joinedload(StockTransfer.from_branch),
        joinedload(StockTransfer.to_branch),
        joinedload(StockTransfer.raw_material)
    )
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        query = query.filter(
            (StockTransfer.from_branch_id == current_user.branch_id) | 
            (StockTransfer.to_branch_id == current_user.branch_id)
        )
    transfers = query.all()
    return [_format_transfer(t, db) for t in transfers]

@router.patch("/{transfer_id}/approve", response_model=StockTransferResponse)
async def approve_transfer(
    transfer_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_manager)
):
    """Sender branch manager or Owner approves the transfer."""
    transfer = db.query(StockTransfer).filter(StockTransfer.id == transfer_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    
    # Only sender branch or Owner can approve
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN] and current_user.branch_id != transfer.from_branch_id:
        raise HTTPException(status_code=403, detail="Only the sender branch can approve this transfer")
    
    if transfer.status != StockTransferStatus.PENDING:
        raise HTTPException(status_code=400, detail="Transfer already processed")
        
    # Check if sender has enough stock
    source_rm = db.query(RawMaterial).filter(RawMaterial.id == transfer.raw_material_id).with_for_update().first()
    if source_rm.stock < transfer.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock in sender branch")
        
    # 1. Deduct from sender
    source_rm.stock -= transfer.quantity
    
    # 2. Update status
    transfer.status = StockTransferStatus.APPROVED
    db.commit()
    db.refresh(transfer)
    return _format_transfer(transfer, db)

@router.patch("/{transfer_id}/receive", response_model=StockTransferResponse)
async def complete_transfer(
    transfer_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """Receiver branch manager confirms receipt."""
    transfer = db.query(StockTransfer).filter(StockTransfer.id == transfer_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    
    # Only receiver branch or Owner can complete
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN] and current_user.branch_id != transfer.to_branch_id:
        raise HTTPException(status_code=403, detail="Only the receiver branch can complete this transfer")
    
    if transfer.status != StockTransferStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Transfer is not in approved state")
        
    # Find target RM in receiver branch
    source_rm = db.query(RawMaterial).filter(RawMaterial.id == transfer.raw_material_id).first()
    target_rm = db.query(RawMaterial).filter(
        RawMaterial.name == source_rm.name,
        RawMaterial.branch_id == transfer.to_branch_id
    ).with_for_update().first()
    
    if not target_rm:
        # Create RM in receiver branch if it doesn't exist? Or error out?
        # Usually coffee shops have same RM list.
        raise HTTPException(status_code=404, detail="Target raw material not found in receiver branch")
        
    # 1. Add to receiver
    target_rm.stock += transfer.quantity
    
    # 2. Update status
    transfer.status = StockTransferStatus.COMPLETED
    db.commit()
    db.refresh(transfer)
    return _format_transfer(transfer, db)

def _format_transfer(t, db):
    return {
        "id": t.id,
        "from_branch_id": t.from_branch_id,
        "from_branch_name": t.from_branch.name if t.from_branch else "Unknown",
        "to_branch_id": t.to_branch_id,
        "to_branch_name": t.to_branch.name if t.to_branch else "Unknown",
        "raw_material_id": t.raw_material_id,
        "raw_material_name": t.raw_material.name if t.raw_material else "Deleted Item",
        "quantity": t.quantity,
        "unit": t.raw_material.unit if t.raw_material else "unit",
        "status": t.status,
        "created_at": t.created_at
    }
@router.patch("/{transfer_id}/cancel", response_model=StockTransferResponse)
async def cancel_transfer(
    transfer_id: int,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    transfer = db.query(StockTransfer).filter(StockTransfer.id == transfer_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    
    # Only sender or receiver (or owner) can cancel
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        if current_user.branch_id not in [transfer.from_branch_id, transfer.to_branch_id]:
            raise HTTPException(status_code=403, detail="Unauthorized")
            
    if transfer.status == StockTransferStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Cannot cancel a completed transfer")
        
    # If it was approved, we need to return stock to sender
    if transfer.status == StockTransferStatus.APPROVED:
        source_rm = db.query(RawMaterial).filter(
            RawMaterial.branch_id == transfer.from_branch_id,
            RawMaterial.id == transfer.raw_material_id
        ).with_for_update().first()
        if source_rm:
            source_rm.stock += transfer.quantity
            
    transfer.status = StockTransferStatus.CANCELLED
    db.commit()
    db.refresh(transfer)
    
    return _format_transfer(transfer, db)
