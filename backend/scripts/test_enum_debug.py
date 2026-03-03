from app.core import database
from app.models.models import User
import sys

def test_enum_access():
    db = database.SessionLocal()
    try:
        user = db.query(User).filter(User.username == "manager1").first()
        if not user:
            print("manager1 not found")
            return
        
        print(f"User: {user.username}")
        print(f"Role type: {type(user.role)}")
        print(f"Role value: {user.role}")
        
        try:
            val = user.role.value
            print(f"role.value: {val}")
        except AttributeError:
            print("ERROR: role has no attribute 'value' (It is likely a string, not an Enum)")
            
    finally:
        db.close()

if __name__ == "__main__":
    test_enum_access()
