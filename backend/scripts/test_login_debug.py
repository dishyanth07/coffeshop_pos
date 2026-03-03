from app.core import security, database
from app.models.models import User
import sys

def test_login(username, password):
    db = database.SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"[{username}] NOT FOUND")
            return
        
        is_valid = security.verify_password(password, user.password_hash)
        if is_valid:
            print(f"[{username}] SUCCESS | Password: {password} | Role: {user.role} | Branch ID: {user.branch_id}")
        else:
            print(f"[{username}] FAILED | Password: {password}")
    finally:
        db.close()

if __name__ == "__main__":
    print("--- LOGIN TEST RESULTS ---")
    users_to_test = [
        ("admin", "admin123"),
        ("owner", "ownerpassword"),
        ("manager1", "managerpassword"),
        ("manager1", "debug123"),
        ("manager_4_dish_cafe", "managerpassword"),
        ("manager_4_dish_cafe", "debug123"),
    ]
    
    for username, password in users_to_test:
        test_login(username, password)
    print("--------------------------")
