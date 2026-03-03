from app.core import security, database
from app.models.models import User

def check():
    db = database.SessionLocal()
    u = db.query(User).filter(User.username == 'admin').first()
    print(f"FOUND: {u.username if u else 'NONE'}")
    if u:
        print(f"PASSWORD VALID (admin123): {security.verify_password('admin123', u.password_hash)}")
        print(f"PASSWORD VALID (admin): {security.verify_password('admin', u.password_hash)}")
    db.close()

if __name__ == "__main__":
    check()
