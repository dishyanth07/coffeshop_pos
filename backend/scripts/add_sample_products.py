from sqlalchemy.orm import Session
from app.core import database
from app.models.models import Product, Inventory

def add_sample_products():
    db = database.SessionLocal()
    try:
        # Check if products already exist
        existing = db.query(Product).first()
        if existing:
            print("Products already exist. Skipping...")
            return

        # Sample coffee shop products
        products_data = [
            {"name": "Espresso", "description": "Rich and bold espresso shot", "price": 2.50, "category": "Coffee", "stock": 50},
            {"name": "Cappuccino", "description": "Espresso with steamed milk foam", "price": 3.50, "category": "Coffee", "stock": 40},
            {"name": "Latte", "description": "Smooth espresso with steamed milk", "price": 4.00, "category": "Coffee", "stock": 45},
            {"name": "Americano", "description": "Espresso with hot water", "price": 2.75, "category": "Coffee", "stock": 35},
            {"name": "Mocha", "description": "Chocolate espresso delight", "price": 4.50, "category": "Coffee", "stock": 30},
            {"name": "Croissant", "description": "Buttery flaky pastry", "price": 3.00, "category": "Pastry", "stock": 25},
            {"name": "Blueberry Muffin", "description": "Fresh baked muffin", "price": 2.50, "category": "Pastry", "stock": 20},
            {"name": "Bagel", "description": "Toasted with cream cheese", "price": 3.50, "category": "Pastry", "stock": 15},
        ]

        print("Adding sample products...")
        for product_data in products_data:
            stock_qty = product_data.pop("stock")
            
            # Create product
            product = Product(**product_data)
            db.add(product)
            db.flush()  # Get the product ID
            
            # Create inventory
            inventory = Inventory(product_id=product.id, quantity=stock_qty)
            db.add(inventory)
            
            print(f"✅ Added: {product.name} (Stock: {stock_qty})")

        db.commit()
        print("\n🎉 Sample products added successfully!")
        print("You can now test the POS system with these products.")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    add_sample_products()
