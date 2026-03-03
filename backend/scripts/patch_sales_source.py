import sqlite3
import os

db_path = 'coffeshop.db'

if not os.path.exists(db_path):
    print(f"Database {db_path} not found.")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if source column exists
        cursor.execute("PRAGMA table_info(sales)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'source' not in columns:
            print("Adding 'source' column to 'sales' table...")
            cursor.execute("ALTER TABLE sales ADD COLUMN source TEXT DEFAULT 'pos'")
            conn.commit()
            print("Column added successfully.")
        else:
            print("Column 'source' already exists in 'sales' table.")
            
    except Exception as e:
        print(f"Error patching database: {e}")
    finally:
        conn.close()
