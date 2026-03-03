import sqlite3
import os

db_path = 'coffeshop.db'

if not os.path.exists(db_path):
    print(f"Database {db_path} not found.")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        print("Recreating 'customer_orders' table to allow nullable table_id...")
        
        # 1. Create temporary table
        cursor.execute("""
        CREATE TABLE customer_orders_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_id INTEGER,
            branch_id INTEGER NOT NULL,
            source TEXT DEFAULT 'pos',
            status TEXT DEFAULT 'pending',
            total_amount FLOAT NOT NULL,
            customer_name TEXT,
            customer_phone TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME,
            FOREIGN KEY(table_id) REFERENCES tables(id),
            FOREIGN KEY(branch_id) REFERENCES branches(id)
        )
        """)
        
        # 2. Copy data from old table if it exists
        cursor.execute("PRAGMA table_info(customer_orders)")
        columns = [column[1] for column in cursor.fetchall()]
        
        col_list = ["id", "table_id", "branch_id", "status", "total_amount", "customer_name", "customer_phone", "created_at", "updated_at"]
        # Only include columns that actually exist in the old table
        existing_cols = [c for c in col_list if c in columns]
        
        source_cols = ", ".join(existing_cols)
        cursor.execute(f"INSERT INTO customer_orders_new ({source_cols}) SELECT {source_cols} FROM customer_orders")
        
        # 3. Drop old table and rename new one
        cursor.execute("DROP TABLE customer_orders")
        cursor.execute("ALTER TABLE customer_orders_new RENAME TO customer_orders")
        
        print("Success.")
        conn.commit()
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()
