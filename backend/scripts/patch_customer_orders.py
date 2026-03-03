import sqlite3
import os

db_path = 'coffeshop.db'

if not os.path.exists(db_path):
    print(f"Database {db_path} not found.")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check column names
        cursor.execute("PRAGMA table_info(customer_orders)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Add source column if missing
        if 'source' not in columns:
            print("Adding 'source' column to 'customer_orders'...")
            cursor.execute("ALTER TABLE customer_orders ADD COLUMN source TEXT DEFAULT 'pos'")
            
        print("Success.")
        conn.commit()
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()
