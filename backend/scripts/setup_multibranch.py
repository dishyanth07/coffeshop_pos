import os
import sys
from sqlalchemy.orm import Session
from app.core import security
from app.core.database import SessionLocal, engine, Base
from sqlalchemy import text
from app.models.models import User, Branch, UserRole

def migrate_schema(db):
    print("Checking for schema updates...")
    tables_to_update = {
        "users": "branch_id",
        "products": "branch_id",
        "inventory": "branch_id",
        "raw_materials": "branch_id",
        "purchase_orders": "branch_id",
        "sales": "branch_id"
    }
    
    for table, column in tables_to_update.items():
        try:
            # Check if column exists
            db.execute(text(f"SELECT {column} FROM {table} LIMIT 1"))
        except Exception:
            print(f"Adding missing column {column} to table {table}...")
            try:
                db.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} INTEGER"))
                db.commit()
            except Exception as e:
                print(f"Failed to add column to {table}: {e}")
                db.rollback()

def sync_orphans(db, main_branch_id):
    print(f"Syncing existing data to branch ID: {main_branch_id}...")
    tables = ["users", "products", "inventory", "raw_materials", "purchase_orders", "sales"]
    for table in tables:
        try:
            result = db.execute(text(f"UPDATE {table} SET branch_id = :branch_id WHERE branch_id IS NULL"), {"branch_id": main_branch_id})
            db.commit()
            if result.rowcount > 0:
                print(f"Updated {result.rowcount} orphan rows in {table}.")
        except Exception as e:
            print(f"Failed to sync {table}: {e}")
            db.rollback()

def setup_db():
    print("Initializing Multi-Branch Coffee Shop POS Database...")
    
    # Optional: Delete existing DB to start fresh with new schema
    db_path = "coffeshop.db"
    if os.path.exists(db_path):
        try:
            print(f"Attempting to delete existing database: {db_path}")
            # os.remove(db_path) # Commented out to avoid lock issues in dev
            print("Deletion skipped to avoid lock issues. Schema will be updated/created.")
        except Exception as e:
            print(f"Could not delete {db_path}: {e}")
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    print("Base tables processed.")
    
    db = SessionLocal()
    try:
        migrate_schema(db)
        # 1. Create Owner User
        owner_username = "owner"
        owner_password = "ownerpassword"
        
        owner_user = db.query(User).filter(User.username == owner_username).first()
        if not owner_user:
            hashed_password = security.get_password_hash(owner_password)
            owner_user = User(
                username=owner_username,
                password_hash=hashed_password,
                role=UserRole.OWNER,
                is_active=True
            )
            db.add(owner_user)
            db.flush() # Get ID
            print(f"Owner created: {owner_username}")
        else:
            print(f"Owner already exists: {owner_username}")
        
        # 2. Create Main Branch
        main_branch = db.query(Branch).filter(Branch.name == "Main Branch").first()
        if not main_branch:
            main_branch = Branch(
                name="Main Branch",
                location="Central City",
                owner_id=owner_user.id,
                is_active=True
            )
            db.add(main_branch)
            db.flush() # Get Branch ID
            print("Main Branch created.")
        else:
            print("Main Branch already exists.")
        
        # Sync orphans to main branch
        sync_orphans(db, main_branch.id)
        
        # 3. Create a Manager for Main Branch
        manager_username = "manager1"
        manager_password = "managerpassword"
        
        manager_user = db.query(User).filter(User.username == manager_username).first()
        if not manager_user:
            manager_user = User(
                username=manager_username,
                password_hash=security.get_password_hash(manager_password),
                role=UserRole.BRANCH_MANAGER,
                branch_id=main_branch.id,
                is_active=True
            )
            db.add(manager_user)
            print(f"Manager created: {manager_username}")
        else:
            print(f"Manager already exists: {manager_username}")
        
        db.commit()
        print("-" * 30)
        print("Setup Complete!")
        print(f"Owner created: {owner_username} / {owner_password}")
        print(f"Manager created: {manager_username} / {manager_password}")
        print(f"Branch created: {main_branch.name}")
        print("-" * 30)
        
    except Exception as e:
        print(f"Error during setup: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    setup_db()
