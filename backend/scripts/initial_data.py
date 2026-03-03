from sqlalchemy.orm import Session
from app.core import database, security
from app.models.models import User, UserRole

def create_initial_data():
    # Create tables if they don't exist
    print("Creating tables...")
    from app.core.database import engine, Base
    Base.metadata.create_all(bind=engine)

    db = database.SessionLocal()
    try:
        user = db.query(User).filter(User.username == "admin").first()
        if not user:
            print("Creating initial admin user...")
            hashed_password = security.get_password_hash("admin123")
            admin_user = User(
                username="admin",
                password_hash=hashed_password,
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("Admin user created: username=admin, password=admin123")
        else:
            print("Admin user already exists.")
    finally:
        db.close()

if __name__ == "__main__":
    create_initial_data()
