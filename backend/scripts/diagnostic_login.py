from app.core import database, security
from app.models.models import User, Branch
import json

def diagnostic():
    db = database.SessionLocal()
    try:
        print("--- CAFFEINE POS DIAGNOSTIC TOOL ---")
        print(f"DATABASE: {database.SQLALCHEMY_DATABASE_URL}")
        
        users = db.query(User).all()
        print(f"\nTOTAL USERS: {len(users)}")
        
        user_list = []
        for u in users:
            branch_name = "N/A"
            if u.branch_id:
                branch = db.query(Branch).filter(Branch.id == u.branch_id).first()
                branch_name = branch.name if branch else f"ID:{u.branch_id} (NOT FOUND)"
            
            user_list.append({
                "username": u.username,
                "role": u.role.value if hasattr(u.role, 'value') else str(u.role),
                "branch": branch_name,
                "active": u.is_active,
                "pw_change_required": u.require_password_change
            })
            
        print("\nUSER DETAILS:")
        for u in user_list:
            print(f"  - {u['username']} [{u['role']}] | Branch: {u['branch']} | Status: {'Active' if u['active'] else 'Inactive'}")
            if u['pw_change_required']:
                print("    * ACTION REQUIRED: Password change needed on next login")

        print("\nKNOW PASSWORDS (TRY THESE):")
        print("  - manager1: managerpassword")
        print("  - manager_4_dish_cafe: debug123")
        print("  - owner: ownerpassword")
        print("  - admin: admin123")
        
        print("\n-------------------------------------")
        
    finally:
        db.close()

if __name__ == "__main__":
    diagnostic()
