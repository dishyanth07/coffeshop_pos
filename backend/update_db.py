import sqlite3
import os

db_path = r"c:\Users\dishy\OneDrive\Desktop\coffeshop_pos\backend\coffeshop.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN phone_number VARCHAR")
        cursor.execute("CREATE UNIQUE INDEX ix_users_phone_number ON users (phone_number)")
        conn.commit()
        print("Successfully added phone_number column and index to users table.")
    except sqlite3.OperationalError as e:
        print(f"Error (maybe column exists?): {e}")
    finally:
        conn.close()
else:
    print(f"Database {db_path} not found.")
