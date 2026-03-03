import sqlite3
import json

def main():
    try:
        conn = sqlite3.connect("coffeshop.db")
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, role, branch_id, is_active FROM users")
        rows = cursor.fetchall()
        users = []
        for r in rows:
            users.append({
                "id": r[0],
                "username": r[1],
                "role": r[2],
                "branch_id": r[3],
                "is_active": r[4]
            })
        print(json.dumps(users, indent=2))
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
