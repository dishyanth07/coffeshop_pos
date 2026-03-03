import sqlite3
import os

db_path = "coffeshop.db"

def inspect_db():
    if not os.path.exists(db_path):
        print(f"Error: {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cursor.fetchall() if not t[0].startswith('sqlite_')]
    
    print(f"# Coffee Shop POS Database Audit\n")
    print(f"**Database File**: `{db_path}`")
    print(f"**Total Tables**: {len(tables)} ({', '.join(tables)})\n")

    for table in tables:
        print(f"### Table: {table}")
        cursor.execute(f"PRAGMA table_info({table});")
        cols = [c[1] for c in cursor.fetchall()]
        print("| " + " | ".join(cols) + " |")
        print("| " + " | ".join(["---"] * len(cols)) + " |")
        
        cursor.execute(f"SELECT * FROM {table} LIMIT 5")
        rows = cursor.fetchall()
        for row in rows:
            print("| " + " | ".join(map(str, row)) + " |")
        print("\n")

    conn.close()

if __name__ == "__main__":
    inspect_db()
