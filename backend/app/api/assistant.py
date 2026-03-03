from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Dict
from app.api import deps
from app.core import database
from app.models.models import Sale, SaleItem, RawMaterial, Product, Branch, AssistantMessage, User, UserRole, PurchaseOrder
from app.schemas.schemas import AssistantQuery, AssistantResponse, AssistantMessageResponse
import os
import json

router = APIRouter()

# Use an absolute path for the offer file to ensure consistency across server reloads
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OFFER_FILE = os.path.join(BASE_DIR, "crisis_offer.json") 

def get_active_offer():
    """Read the active offer from disk."""
    if not os.path.exists(OFFER_FILE):
        return {}
    try:
        with open(OFFER_FILE, "r") as f:
            return json.load(f)
    except:
        return {}

def set_active_offer(offer_dict):
    """Save the active offer to disk (pass None or {} to clear)."""
    try:
        with open(OFFER_FILE, "w") as f:
            json.dump(offer_dict or {}, f)
    except Exception as e:
        print(f"ERROR: Failed to save offer: {e}")

def get_business_metrics(db: Session):
    # 1. Today's Sales
    today = datetime.now().date()
    yesterday = today - timedelta(days=1)
    
    today_sales = db.query(func.sum(Sale.total_amount)).filter(
        func.date(Sale.created_at) == today,
        Sale.status == "completed"
    ).scalar() or 0.0
    
    yesterday_sales = db.query(func.sum(Sale.total_amount)).filter(
        func.date(Sale.created_at) == yesterday,
        Sale.status == "completed"
    ).scalar() or 0.0
    
    # 2. Weekly Comparison (Current vs Last 7 days)
    last_week_start = today - timedelta(days=14)
    this_week_start = today - timedelta(days=7)
    
    this_week_sales = db.query(func.sum(Sale.total_amount)).filter(
        Sale.created_at >= this_week_start,
        Sale.status == "completed"
    ).scalar() or 0.0
    
    last_week_sales = db.query(func.sum(Sale.total_amount)).filter(
        Sale.created_at >= last_week_start,
        Sale.created_at < this_week_start,
        Sale.status == "completed"
    ).scalar() or 0.0
    
    # 3. Profit Margins (Simple estimation: Revenue - PO Cost)
    # This is complex to do accurately without full cost tracking, but we can use POs as a proxy
    total_po_cost = db.query(func.sum(PurchaseOrder.total_amount)).scalar() or 0.0
    total_revenue = db.query(func.sum(Sale.total_amount)).filter(Sale.status == "completed").scalar() or 0.0
    global_margin = ((total_revenue - total_po_cost) / total_revenue * 100) if total_revenue > 0 else 0
    
    # 4. Low Stock Alerts
    low_stock_count = db.query(RawMaterial).filter(RawMaterial.stock <= RawMaterial.min_level).count()
    
    # 5. Branch Performance
    branch_stats = db.query(
        Branch.name,
        func.sum(Sale.total_amount).label("sales")
    ).join(Sale, Sale.branch_id == Branch.id).filter(Sale.status == "completed").group_by(Branch.id).all()
    
    branch_performance = [{"name": b.name, "sales": b.sales} for b in branch_stats]
    
    return {
        "today_sales": today_sales,
        "yesterday_sales": yesterday_sales,
        "daily_growth": ((today_sales - yesterday_sales) / yesterday_sales * 100) if yesterday_sales > 0 else (100 if today_sales > 0 else 0),
        "this_week_sales": this_week_sales,
        "last_week_sales": last_week_sales,
        "weekly_growth": ((this_week_sales - last_week_sales) / last_week_sales * 100) if last_week_sales > 0 else 0,
        "global_margin": round(global_margin, 2),
        "low_stock_alerts": low_stock_count,
        "branch_performance": branch_performance
    }

def get_crisis_status(db: Session):
    today = datetime.now().date()
    
    # Analyze last 7 days daily revenue
    daily_revenue = []
    for i in range(7):
        d = today - timedelta(days=i)
        rev = db.query(func.sum(Sale.total_amount)).filter(
            func.date(Sale.created_at) == d,
            Sale.status == "completed"
        ).scalar() or 0.0
        daily_revenue.append(rev)
    
    # Crisis Detection Engine: 15% decline in last 3 days avg vs previous 3 days avg
    recent_avg = sum(daily_revenue[0:3]) / 3
    previous_avg = sum(daily_revenue[3:6]) / 3
    
    decline_pct = 0
    if previous_avg > 0:
        decline_pct = ((previous_avg - recent_avg) / previous_avg) * 100
        
    is_crisis = decline_pct > 15
    
    status = "CRISIS" if is_crisis else "NORMAL"
    alerts = []
    recommendations = []
    
    if is_crisis:
        alerts.append(f"Revenue has declined by {decline_pct:.1f}% over the last 3 days.")
        recommendations.append({
            "id": "marketing_push",
            "title": "Emergency Marketing",
            "description": "Send a 20% discount coupon to your top 50 customers via WhatsApp.",
            "impact": "High"
        })
        recommendations.append({
            "id": "stock_optimization",
            "title": "Smart Reorder Adjustment",
            "description": "Reduce upcoming raw material orders by 15% to preserve cash flow.",
            "impact": "Medium"
        })
        
    # Check for low margins
    total_po_cost = db.query(func.sum(PurchaseOrder.total_amount)).scalar() or 0.0
    total_revenue = db.query(func.sum(Sale.total_amount)).filter(Sale.status == "completed").scalar() or 0.0
    global_margin = ((total_revenue - total_po_cost) / total_revenue * 100) if total_revenue > 0 else 0
    
    if global_margin < 20:
        alerts.append(f"Global profit margin is critical at {global_margin:.1f}%.")
        recommendations.append({
            "id": "cost_reduction",
            "title": "Expense Control",
            "description": "Inventory costs are high. Consider renegotiating with suppliers or switching to alternative materials.",
            "impact": "High"
        })

    # Management of active offers
    active_offer = get_active_offer()
    
    # Refined Recovery Check: Only clear if status is NORMAL AND we have valid data showing recovery
    if status == "NORMAL" and active_offer:
        # If we have revenue data and the decline is low/non-existent, then we truly recovered
        if previous_avg > 0 and decline_pct <= 5:
            print(f"DEBUG: Confirmed recovery (Decline: {decline_pct}%). Clearing persistent offers.")
            set_active_offer(None)
            active_offer = {}
        else:
            print(f"DEBUG: Business is NORMAL but recovery not confirmed yet. Keeping offer active.")

    return {
        "status": status,
        "decline_pct": round(decline_pct, 1),
        "alerts": alerts,
        "recommendations": recommendations,
        "daily_trends": list(reversed(daily_revenue)),
        "active_offers": active_offer
    }

def generate_ai_response(query: str, metrics: Dict):
    q = query.lower()
    resp = ""
    
    # Check for branch names in query
    branch_mentions = [b for b in metrics['branch_performance'] if b['name'].lower() in q]
    
    if "hello" in q or "hi " in q or q == "hi":
        resp = "Hello! I'm your Business Assistant. How can I help you analyze your coffee shop's performance today?"
        
    elif "sale" in q or "revenue" in q or "performance" in q or "money" in q:
        resp = f"Today's revenue is ₹{metrics['today_sales']:.2f}. "
        if metrics['yesterday_sales'] > 0:
            growth = metrics['daily_growth']
            resp += f"That's a {abs(growth):.1f}% {'increase' if growth >= 0 else 'decrease'} compared to yesterday. "
        resp += f"Weekly total is ₹{metrics['this_week_sales']:.2f}."
        
    elif branch_mentions:
        b = branch_mentions[0]
        resp = f"The {b['name']} has generated ₹{b['sales']:.2f} in total revenue so far. "
        if b['sales'] > 0:
            resp += "It's performing well! Is there anything specific about this branch you'd like to know?"
        else:
            resp += "There hasn't been any recorded sales for this branch yet."

    elif "stock" in q or "inventory" in q or "supply" in q or "material" in q:
        if metrics['low_stock_alerts'] > 0:
            resp = f"We have {metrics['low_stock_alerts']} items low on stock. I recommend checking the Procurement section on the dashboard to restock."
        else:
            resp = "All inventory levels are currently above minimum requirements. Everything looks good!"
            
    elif "profit" in q or "margin" in q or "earn" in q:
        resp = f"The estimated global profit margin is {metrics['global_margin']}%. "
        if metrics['global_margin'] < 20:
            resp += "Margins are a bit tight. We might want to look into optimizing raw material costs."
        else:
            resp += "Your margins are healthy and within expected targets."
            
    elif "coffee" in q or "product" in q or "menu" in q:
        resp = "Our system shows a wide variety of products. Sales are being tracked per item. Would you like a breakdown of the top-performing categories?"

    elif "help" in q or "what can you do" in q:
        resp = "I can provide real-time updates on daily sales, track weekly growth, monitor low-stock alerts, and compare performance across different branches. Just ask me something like 'How are sales today?'"
    
    elif "health" in q or "crisis" in q or "status" in q:
        # This will be handled by the frontend but we can provide a text summary too
        resp = "I'm analyzing your business health... Based on recent trends, I've prepared a detailed assessment in the Crisis Advisor panel. Generally, we look at revenue stability and profit margins."
    
    else:
        resp = "I'm not quite sure about that. I'm best at discussing sales, inventory levels, and branch performance. Could you try rephrasing your question?"

    return resp
@router.post("/query", response_model=AssistantResponse)
async def query_assistant(
    query_in: AssistantQuery,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only owners and admins can access the Assistant.")
    
    # Store user message
    user_msg = AssistantMessage(
        user_id=current_user.id,
        role="user",
        content=query_in.query
    )
    db.add(user_msg)
    
    # Get metrics
    metrics = get_business_metrics(db)
    
    # Generate AI Response
    ai_content = generate_ai_response(query_in.query, metrics)
    
    # Store assistant response
    ai_msg = AssistantMessage(
        user_id=current_user.id,
        role="assistant",
        content=ai_content
    )
    db.add(ai_msg)
    
    db.commit()
    
    return {
        "response": ai_content,
        "metrics": metrics
    }

@router.get("/history", response_model=List[AssistantMessageResponse])
async def get_history(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only owners and admins can access the Assistant history.")
    
    messages = db.query(AssistantMessage).filter(
        AssistantMessage.user_id == current_user.id
    ).order_by(AssistantMessage.timestamp.asc()).all()
    
    return messages

@router.get("/crisis-status")
async def get_crisis_info(
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only owners and admins can access Crisis Mode.")
    return get_crisis_status(db)

@router.post("/crisis-actions")
async def trigger_crisis_action(
    action_id: str,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only owners and admins can trigger crisis actions.")
    
    if action_id == 'marketing_push':
        offer = {'discount_pct': 20.0, 'activated_at': datetime.now().isoformat()}
        set_active_offer(offer)
        return {"message": "Emergency Marketing activated. 20% discount is now automatically applied to all orders."}
    
    # Mock action execution
    return {"message": f"Action '{action_id}' has been initiated. Monitoring for impact..."}
