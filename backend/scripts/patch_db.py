import sqlite3
import os

db_path = 'coffeshop.db'
if not os.path.exists(db_path):
    print(f"Database {db_path} not found.")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def add_column_if_missing(table, column, definition):
    cursor.execute(f"PRAGMA table_info({table})")
    columns = [row[1] for row in cursor.fetchall()]
    if column not in columns:
        print(f"Adding column {column} to table {table}...")
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
        conn.commit()
    else:
        print(f"Column {column} already exists in table {table}.")

try:
    # From previous fix
    add_column_if_missing('suppliers', 'branch_id', 'INTEGER')
    add_column_if_missing('customers', 'branch_id', 'INTEGER')
    # New requirement
    add_column_if_missing('users', 'require_password_change', 'BOOLEAN DEFAULT 0')
    print("Database patching complete.")
except Exception as e:
    print(f"Error patching database: {e}")
finally:
    conn.close()
