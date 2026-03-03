import sqlite3
import os

db_path = 'coffeshop.db'
if not os.path.exists(db_path):
    print(f"Database {db_path} not found.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

tables = ['suppliers', 'customers', 'sales', 'products', 'inventory', 'raw_materials']

print("--- Database Schema Verification ---")
for table in tables:
    try:
        cursor.execute(f"PRAGMA table_info({table})")
        columns = [row[1] for row in cursor.fetchall()]
        print(f"Table '{table}': {columns}")
        if 'branch_id' not in columns:
            print(f"  WARNING: 'branch_id' missing in '{table}'")
    except Exception as e:
        print(f"  ERROR checking '{table}': {e}")

conn.close()
