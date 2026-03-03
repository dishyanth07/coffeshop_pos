from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import List, Dict
from app.api import deps
from app.core import database
from app.models.models import Sale, SaleItem, Product, Customer, User, UserRole, RawMaterial, PurchaseOrderItem, PurchaseOrder

router = APIRouter()
FORCE_GROWTH = False # In-memory flag for demo/manual activation

def get_recovery_metrics(db: Session):
    today = datetime.now().date()
    
    # 1. Recovery Detection Engine
    # Compare last 7 days vs previous 7 days
    recent_start = today - timedelta(days=7)
    previous_start = today - timedelta(days=14)
    
    recent_sales = db.query(func.sum(Sale.total_amount)).filter(
        Sale.created_at >= recent_start,
        Sale.status == "completed"
    ).scalar() or 0.0
    
    previous_sales = db.query(func.sum(Sale.total_amount)).filter(
        Sale.created_at >= previous_start,
        Sale.created_at < recent_start,
        Sale.status == "completed"
    ).scalar() or 0.0
    
    growth_pct = 0
    if previous_sales > 0:
        growth_pct = ((recent_sales - previous_sales) / previous_sales) * 100
    
    # Recovery Score: Normalized growth + stability
    # Max score 100. Growth > 20% is excellent.
    recovery_score = min(100, max(0, int(growth_pct * 2 + 30))) if growth_pct > 0 else 25
    
    is_recovering = (growth_pct > 5) or FORCE_GROWTH # Respect manual override
    
    return {
        "is_recovering": is_recovering,
        "is_forced": FORCE_GROWTH,
        "growth_pct": round(growth_pct, 1),
        "recovery_score": max(recovery_score, 85 if FORCE_GROWTH else 0), # High score if forced
        "recent_sales": recent_sales,
        "previous_sales": previous_sales
    }

@router.get("/status")
async def get_recovery_status(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    metrics = get_recovery_metrics(db)
    
    # 2. Growth Plan Generator (Mocked based on stats)
    growth_plan = [
        {"day": 1, "task": "Launch 'Welcome Back' email campaign", "status": "pending"},
        {"day": 5, "task": "Introduce 2 seasonal high-margin beverages", "status": "pending"},
        {"day": 10, "task": "Review staff performance & distribute recovery bonuses", "status": "pending"},
        {"day": 20, "task": "Expand afternoon happy hour to drive off-peak traffic", "status": "pending"},
        {"day": 30, "task": "Analyze recovery ROI and set new baseline", "status": "pending"}
    ]
    
    return {
        **metrics,
        "growth_plan": growth_plan
    }

@router.post("/toggle-engine")
async def toggle_growth_engine(
    current_user: User = Depends(deps.get_current_active_user)
):
    global FORCE_GROWTH
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    FORCE_GROWTH = not FORCE_GROWTH
    return {"is_recovering": FORCE_GROWTH, "message": f"Growth Engine {'Activated' if FORCE_GROWTH else 'Deactivated'}"}

@router.get("/win-back")
async def get_win_back_customers(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # Identify inactive customers (no sales in last 30 days but previously regular)
    thirty_days_ago = datetime.now() - timedelta(days=30)
    
    # Subquery for customers who bought something in the last 30 days
    recent_customer_ids = db.query(Sale.customer_id).filter(
        Sale.created_at >= thirty_days_ago,
        Sale.customer_id.isnot(None)
    ).distinct().subquery()
    
    # Find customers NOT in that subquery who have at least 2 previous sales
    inactive_customers = db.query(Customer).filter(
        ~Customer.id.in_(recent_customer_ids)
    ).join(Sale).group_by(Customer.id).having(func.count(Sale.id) >= 2).all()
    
    return [
        {
            "id": c.id,
            "name": c.name or f"Customer {c.phone[-4:]}",
            "phone": c.phone,
            "last_visit_days": (datetime.now() - (db.query(func.max(Sale.created_at)).filter(Sale.customer_id == c.id).scalar() or datetime.now())).days,
            "total_orders": db.query(func.count(Sale.id)).filter(Sale.customer_id == c.id).scalar(),
            "suggested_offer": "25% Off Next Visit"
        } for c in inactive_customers
    ]

@router.get("/profit-optimization")
async def get_profit_suggestions(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    # Mocking high-margin products based on typical coffee shop profiles
    # In a real app, this would join with recipe costs
    products = db.query(Product).limit(10).all()
    
    suggestions = []
    for p in products:
        # Heuristic: Espresso/Tea items have higher margins (70-80%) vs food (40-50%)
        is_high_margin = "espresso" in p.name.lower() or "tea" in p.name.lower() or "latte" in p.name.lower()
        if is_high_margin:
            suggestions.append({
                "product_id": p.id,
                "name": p.name,
                "margin_estimate": "75-80%",
                "strategy": "Upsell with combos",
                "priority": "High"
            })
    
    return suggestions

@router.get("/reputation-repair")
async def get_reputation_items(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    # Identify "Happy Customers" - visited > 3 times in last 14 days
    fourteen_days_ago = datetime.now() - timedelta(days=14)
    happy_customers = db.query(Customer).join(Sale).filter(
        Sale.created_at >= fourteen_days_ago
    ).group_by(Customer.id).having(func.count(Sale.id) >= 3).all()
    
    return [
        {
            "id": c.id,
            "name": c.name or c.phone,
            "visit_count": db.query(func.count(Sale.id)).filter(Sale.customer_id == c.id, Sale.created_at >= fourteen_days_ago).scalar(),
            "status": "Ready for Review Request"
        } for c in happy_customers
    ]

@router.get("/menu-optimization")
async def get_menu_recommendations(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    # Bottom performing items (last 30 days)
    thirty_days_ago = datetime.now() - timedelta(days=30)
    
    sale_counts = db.query(
        Product.id,
        Product.name,
        func.count(SaleItem.id).label("total_sold")
    ).outerjoin(SaleItem).join(Sale).filter(
        Sale.created_at >= thirty_days_ago
    ).group_by(Product.id).all()
    
    # If no sales recorded yet, provide some defaults or empty
    if not sale_counts:
        return {"to_remove": [], "to_promote": []}
    
    sale_counts.sort(key=lambda x: x.total_sold)
    
    return {
        "to_remove": [{"id": x.id, "name": x.name, "sold": x.total_sold} for x in sale_counts[:3] if x.total_sold < 5],
        "to_promote": [{"id": x.id, "name": x.name, "sold": x.total_sold} for x in sale_counts[-3:]]
    }

@router.get("/staff-motivation")
async def get_staff_kpis(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    # Performance growth by staff (Sale.user_id)
    # Compare this week vs last week
    this_week_start = datetime.now() - timedelta(days=7)
    last_week_start = datetime.now() - timedelta(days=14)
    
    staff_stats = db.query(
        User.username,
        func.sum(Sale.total_amount).label("sales")
    ).join(Sale, User.id == Sale.user_id).filter(
        Sale.created_at >= this_week_start
    ).group_by(User.id, User.username).all()
    
    return [
        {
            "name": s.username,
            "this_week_sales": float(s.sales or 0),
            "growth": "+12%", # Mocked growth comparison
            "suggestion": "Performance Bonus Target: ₹500 more"
        } for s in staff_stats
    ]
