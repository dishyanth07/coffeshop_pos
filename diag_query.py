from app.core import database
from app.models.models import Sale, User
from sqlalchemy import func
from datetime import datetime, timedelta
import traceback

def diagnostic():
    db = next(database.get_db())
    this_week_start = datetime.now() - timedelta(days=7)
    
    try:
        print("Attempting query...")
        staff_stats = db.query(
            User.username,
            func.sum(Sale.total_amount).label("sales")
        ).join(Sale, User.id == Sale.user_id).filter(
            Sale.created_at >= this_week_start
        ).group_by(User.id, User.username).all()
        print(f"Query successful: {len(staff_stats)} results")
    except Exception as e:
        print("Query failed!")
        traceback.print_exc()

if __name__ == "__main__":
    diagnostic()
