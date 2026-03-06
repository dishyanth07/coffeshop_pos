from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict
from app.api import deps
from app.core import database
from app.models.models import Sale, Branch, User, UserRole

router = APIRouter()

@router.get("/central-overview")
async def get_central_overview(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_manager)
):
    """
    Owner only: Get aggregated multi-branch performance stats.
    """
    # 1. Total Sales across all branches
    total_sales = db.query(func.sum(Sale.total_amount)).scalar() or 0.0
    total_orders = db.query(func.count(Sale.id)).scalar() or 0
    
    # 2. Sales by Branch
    branch_sales = db.query(
        Branch.name,
        func.sum(Sale.total_amount).label("sales"),
        func.count(Sale.id).label("orders")
    ).join(Sale, Sale.branch_id == Branch.id, isouter=True).group_by(Branch.id).all()
    
    performance = [
        {
            "branch_name": name,
            "total_sales": sales or 0.0,
            "total_orders": orders or 0
        }
        for name, sales, orders in branch_sales
    ]
    
    # 3. Recent Activity (Global)
    recent_sales = db.query(Sale).order_by(Sale.created_at.desc()).limit(10).all()
    recent = [
        {
            "id": s.id,
            "branch_name": s.branch.name if s.branch else "Unknown",
            "amount": s.total_amount,
            "date": s.created_at
        }
        for s in recent_sales
    ]
    
    return {
        "total_revenue": total_sales,
        "total_orders": total_orders,
        "branch_performance": performance,
        "recent_global_sales": recent
    }
