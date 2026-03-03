import sqlite3
import os

databases = ["coffeshop.db", "coffee_shop.db", "pos.db"]
print(f"Current Directory: {os.getcwd()}")

for db in databases:
    if not os.path.exists(db):
        print(f"{db}: Not found")
        continue
    try:
        conn = sqlite3.connect(db)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if not cursor.fetchone():
             print(f"{db}: Table 'users' does not exist")
             conn.close()
             continue
             
        cursor.execute("SELECT username, is_active, password_hash FROM users WHERE username='admin'")
        row = cursor.fetchone()
        print(f"{db}: {row}")
        conn.close()
    except Exception as e:
        print(f"{db}: Error {e}")
