from app.core import database, security
from app.models.models import User
from sqlalchemy.orm import Session

def reset_admin():
    db = database.SessionLocal()
    try:
        user = db.query(User).filter(User.username == "admin").first()
        if user:
            print(f"Found user: {user.username}")
            user.password_hash = security.get_password_hash("admin123")
            user.is_active = True
            db.commit()
            print("Password reset to 'admin123' and account activated.")
        else:
            print("User 'admin' not found.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_admin()
