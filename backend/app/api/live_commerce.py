from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import json
import math
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STREAM_FILE = os.path.join(BASE_DIR, "active_stream.json")

def get_stream_state():
    if not os.path.exists(STREAM_FILE):
        return {"is_live": False, "featured_product_id": None}
    try:
        with open(STREAM_FILE, "r") as f:
            return json.load(f)
    except:
        return {"is_live": False, "featured_product_id": None}

def set_stream_state(state):
    try:
        with open(STREAM_FILE, "w") as f:
            json.dump(state, f)
    except Exception as e:
        print(f"ERROR: Failed to save stream state: {e}")

from app.api import deps
from app.core import database
from app.models.models import Product, SaleSource, CustomerOrder, CustomerOrderItem, CustomerOrderStatus, Sale # Keep Sale for get_live_stats
from app.schemas.schemas import LiveCommerceOrder, LiveCommerceStats
from app.core.websockets import manager

router = APIRouter()

def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in kilometers
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2) * math.sin(dLat / 2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dLon / 2) * math.sin(dLon / 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@router.post("/order", response_model=dict)
async def place_live_order(order: LiveCommerceOrder, db: Session = Depends(database.get_db)):
    """
    Public endpoint for placing orders from the Live Stream page with Geo-Fencing.
    """
    try:
        from app.models.models import Branch, AuditLog
        
        # 0. Geo-Fencing & Security Check
        # Bypass if correct QR code is provided
        QR_BYPASS_CODE = "CAFE_SPECIAL"
        
        branch = db.query(Branch).filter(Branch.id == order.branch_id).first()
        if not branch:
            raise HTTPException(status_code=404, detail="Branch not found")

        is_blocked = False
        block_reason = ""

        if order.qr_access_code == QR_BYPASS_CODE:
            print(f"Geo-Fence bypass for order by {order.customer_name} via QR")
        else:
            # Check Geolocation
            if order.latitude is None or order.longitude is None:
                is_blocked = True
                block_reason = "Geolocation missing"
            elif branch.latitude and branch.longitude:
                distance = haversine(order.latitude, order.longitude, branch.latitude, branch.longitude)
                if distance > branch.radius:
                    is_blocked = True
                    block_reason = f"Outside radius ({distance:.2f}km > {branch.radius}km)"

        if is_blocked:
            # Log blocked attempt
            audit = AuditLog(
                user_id=1, # System/Admin user
                action="GEO_BLOCK",
                target_type="order_attempt",
                details=json.dumps({
                    "customer": order.customer_name,
                    "reason": block_reason,
                    "lat": order.latitude,
                    "lon": order.longitude
                }),
                branch_id=order.branch_id
            )
            db.add(audit)
            db.commit()
            raise HTTPException(status_code=403, detail=f"Order blocked: {block_reason}")

        # 1. Verify products and calculate total
        total = 0
        order_items_data = []
        
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
            
            total += product.price * item.quantity
            order_items_data.append({
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price_at_order": product.price
            })

        # 2. Create Customer Order (Pending)
        db_order = CustomerOrder(
            branch_id=order.branch_id,
            source=SaleSource.LIVE_COMMERCE,
            status=CustomerOrderStatus.PENDING,
            total_amount=total,
            customer_name=order.customer_name
        )
        db.add(db_order)
        db.flush()

        # 3. Create items
        for item_data in order_items_data:
            oi = CustomerOrderItem(
                order_id=db_order.id,
                **item_data
            )
            db.add(oi)

        db.commit()
        db.refresh(db_order)

        # 4. Broadcast to WebSockets
        # Fetch current stats for the broadcast
        stats_data = await get_live_stats(db)

        await manager.broadcast({
            "type": "NEW_ORDER",
            "data": {
                "id": db_order.id,
                "amount": db_order.total_amount,
                "customer": order.customer_name,
                "source": "live_commerce",
                "live_stats": stats_data
            }
        })

        return {"status": "success", "order_id": db_order.id}

    except Exception as e:
        db.rollback()
        print(f"Error placing live order: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/toggle-live")
async def toggle_live(is_live: bool):
    """
    Host endpoint to start/stop the live stream.
    """
    state = get_stream_state()
    state["is_live"] = is_live
    if not is_live:
        state["featured_product_id"] = None
    set_stream_state(state)
    
    await manager.broadcast({
        "type": "STREAM_STATUS",
        "data": {"is_live": is_live}
    })
    return {"status": "success", "is_live": is_live}

@router.post("/feature-product")
async def feature_product(product_id: int, db: Session = Depends(database.get_db)):
    """
    Host endpoint to set the currently featured product on the live stream.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    state = get_stream_state()
    state["featured_product_id"] = product_id
    state["is_live"] = True # Auto-live if featuring
    set_stream_state(state)

    await manager.broadcast({
        "type": "FEATURE_UPDATE",
        "data": {
            "id": product.id,
            "name": product.name,
            "price": product.price,
            "category": product.category
        }
    })
    return {"status": "success", "featured_product_id": product_id}

@router.get("/status")
async def get_stream_status(db: Session = Depends(database.get_db)):
    """
    Get current stream status and featured product details.
    """
    state = get_stream_state()
    product = None
    if state["featured_product_id"]:
        product = db.query(Product).filter(Product.id == state["featured_product_id"]).first()
    
    return {
        "is_live": state["is_live"],
        "featured_product": {
            "id": product.id,
            "name": product.name,
            "price": product.price,
            "category": product.category
        } if product else None
    }

@router.get("/stats", response_model=LiveCommerceStats)
async def get_live_stats(db: Session = Depends(database.get_db)):
    # Revenue only from completed sales
    sales_stats = db.query(
        func.sum(Sale.total_amount).label("total")
    ).filter(Sale.source == SaleSource.LIVE_COMMERCE).first()
    
    # Order count from all customer orders initiated
    order_count = db.query(func.count(CustomerOrder.id)).filter(
        CustomerOrder.source == SaleSource.LIVE_COMMERCE
    ).scalar()
    
    total_revenue = float(sales_stats.total or 0)
    
    return {
        "total_live_sales": total_revenue,
        "live_order_count": int(order_count or 0),
        "total": total_revenue,
        "count": int(order_count or 0)
    }

@router.get("/recent-orders", response_model=List[dict])
async def get_recent_live_orders(db: Session = Depends(database.get_db)):
    orders = db.query(CustomerOrder).filter(
        CustomerOrder.source == SaleSource.LIVE_COMMERCE
    ).order_by(CustomerOrder.created_at.desc()).limit(5).all()
    
    return [
        {
            "id": o.id,
            "amount": o.total_amount,
            "customer": o.customer_name or "Viral Fan",
            "status": o.status.value if hasattr(o.status, "value") else o.status,
            "created_at": o.created_at.isoformat()
        }
        for o in orders
    ]
