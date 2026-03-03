import sqlite3
import os

db_path = "backend/app.db"
if not os.path.exists(db_path):
    print(f"DB not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- Products ---")
cursor.execute("SELECT id, name FROM products")
products = cursor.fetchall()
for p in products:
    print(p)

print("\n--- Customizations ---")
cursor.execute("SELECT * FROM product_customizations")
custs = cursor.fetchall()
for c in custs:
    print(c)

conn.close()
