from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, date
import json

from app.api import deps
from app.core import database
from app.models.models import AuditLog, FraudFlag, CashReconciliation, StockCount, User, Product, FraudFlagStatus, UserRole
from app.schemas.schemas import AuditLogResponse, FraudFlagResponse, CashReconciliationCreate, CashReconciliationResponse, StockCountCreate, StockCountResponse, FraudFlagResolve

router = APIRouter()

@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_manager),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    branch_id: Optional[int] = None
):
    query = db.query(AuditLog).options(joinedload(AuditLog.user))
    
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        query = query.filter(AuditLog.branch_id == current_user.branch_id)
    elif branch_id:
        query = query.filter(AuditLog.branch_id == branch_id)
    
    if start_date:
        query = query.filter(AuditLog.timestamp >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.filter(AuditLog.timestamp <= datetime.combine(end_date, datetime.max.time()))
        
    logs = query.order_by(AuditLog.timestamp.desc()).all()
    
    return [
        AuditLogResponse(
            id=l.id,
            user_id=l.user_id,
            username=l.user.username,
            action=l.action,
            target_type=l.target_type,
            target_id=l.target_id,
            details=l.details,
            branch_id=l.branch_id,
            timestamp=l.timestamp
        )
        for l in logs
    ]

@router.get("/alerts", response_model=List[FraudFlagResponse])
async def get_fraud_alerts(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_manager),
    branch_id: Optional[int] = None
):
    query = db.query(FraudFlag).options(joinedload(FraudFlag.user)).filter(FraudFlag.status == FraudFlagStatus.OPEN)
    
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        query = query.filter(FraudFlag.branch_id == current_user.branch_id)
    elif branch_id:
        query = query.filter(FraudFlag.branch_id == branch_id)
        
    flags = query.order_by(FraudFlag.timestamp.desc()).all()
    
    return [
        FraudFlagResponse(
            id=f.id,
            user_id=f.user_id,
            username=f.user.username,
            branch_id=f.branch_id,
            risk_score=f.risk_score,
            reason=f.reason,
            status=f.status.value,
            timestamp=f.timestamp
        )
        for f in flags
    ]

@router.post("/alerts/{flag_id}/resolve")
async def resolve_fraud_flag(
    flag_id: int,
    resolve_in: Optional[FraudFlagResolve] = None,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_manager)
):
    flag = db.query(FraudFlag).filter(FraudFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Fraud flag not found")
    
    flag.status = FraudFlagStatus.RESOLVED
    db.commit()
    return {"message": "Flag resolved"}

@router.post("/reconcile-cash", response_model=CashReconciliationResponse)
async def reconcile_cash(
    reconcile_in: CashReconciliationCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    difference = reconcile_in.actual_amount - reconcile_in.expected_amount
    
    db_rec = CashReconciliation(
        user_id=current_user.id,
        branch_id=current_user.branch_id,
        expected_amount=reconcile_in.expected_amount,
        actual_amount=reconcile_in.actual_amount,
        difference=difference
    )
    
    db.add(db_rec)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="cash_reconciliation",
        target_type="cash_drawer",
        details=json.dumps({"diff": difference}),
        branch_id=current_user.branch_id
    )
    db.add(audit)
    
    # Simple Fraud Check: Difference > ₹5
    if abs(difference) > 5.0:
        flag = FraudFlag(
            user_id=current_user.id,
            branch_id=current_user.branch_id,
            risk_score=20,
            reason=f"Cash reconciliation mismatch: ₹{difference:.2f}"
        )
        db.add(flag)
        
    db.commit()
    db.refresh(db_rec)
    
    return CashReconciliationResponse(
        id=db_rec.id,
        user_id=db_rec.user_id,
        username=current_user.username,
        branch_id=db_rec.branch_id,
        expected_amount=db_rec.expected_amount,
        actual_amount=db_rec.actual_amount,
        difference=db_rec.difference,
        timestamp=db_rec.timestamp
    )

@router.post("/stock-count", response_model=StockCountResponse)
async def record_stock_count(
    count_in: StockCountCreate,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_manager)
):
    product = db.query(Product).filter(Product.id == count_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    difference = count_in.actual_stock - count_in.expected_stock
    
    db_count = StockCount(
        product_id=count_in.product_id,
        branch_id=current_user.branch_id,
        expected_stock=count_in.expected_stock,
        actual_stock=count_in.actual_stock,
        difference=difference,
        user_id=current_user.id
    )
    
    db.add(db_count)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="stock_count",
        target_type="product",
        target_id=count_in.product_id,
        details=json.dumps({"diff": difference, "product": product.name}),
        branch_id=current_user.branch_id
    )
    db.add(audit)
    
    # Fraud Check: Stock missing
    if difference < 0:
        flag = FraudFlag(
            user_id=current_user.id,
            branch_id=current_user.branch_id,
            risk_score=abs(difference) * 2, # Risk proportional to loss
            reason=f"Stock mismatch for {product.name}: {difference} units"
        )
        db.add(flag)
        
    db.commit()
    db.refresh(db_count)
    
    return StockCountResponse(
        id=db_count.id,
        product_id=db_count.product_id,
        product_name=product.name,
        branch_id=db_count.branch_id,
        expected_stock=db_count.expected_stock,
        actual_stock=db_count.actual_stock,
        difference=db_count.difference,
        user_id=db_count.user_id,
        username=current_user.username,
        timestamp=db_count.timestamp
    )
