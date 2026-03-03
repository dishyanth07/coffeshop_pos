from app.core.database import SessionLocal
from app.models.models import Product, Inventory, Branch

db = SessionLocal()
try:
    print("--- Branches ---")
    branches = db.query(Branch).all()
    for b in branches:
        print(f"ID: {b.id}, Name: {b.name}")

    print("\n--- Products & Inventory (Branch 1) ---")
    products = db.query(Product).all()
    for p in products:
        inv = db.query(Inventory).filter(Inventory.product_id == p.id, Inventory.branch_id == 1).first()
        stock = inv.quantity if inv else "N/A"
        print(f"ID: {p.id}, Name: {p.name}, Price: {p.price}, Stock: {stock}")

finally:
    db.close()
