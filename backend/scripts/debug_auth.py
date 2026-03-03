from sqlalchemy.orm import Session
from app.core import database, security
from app.models.models import User

def debug_user():
    db = database.SessionLocal()
    try:
        user = db.query(User).filter(User.username == "admin").first()
        if not user:
            print("❌ User 'admin' NOT found in database.")
        else:
            print(f"✅ User 'admin' found. Role: {user.role}")
            print(f"Stored Hash: {user.password_hash}")
            
            is_valid = security.verify_password("admin123", user.password_hash)
            if is_valid:
                print("✅ Password 'admin123' verifies correctly against stored hash.")
            else:
                print("❌ Password 'admin123' FAILED verification against stored hash.")
                
            # Test hash generation consistency
            test_hash = security.get_password_hash("admin123")
            print(f"Test Hash for 'admin123': {test_hash}")
            
    finally:
        db.close()

if __name__ == "__main__":
    debug_user()
