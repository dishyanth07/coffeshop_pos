import sqlite3

def main():
    try:
        conn = sqlite3.connect("coffeshop.db")
        cursor = conn.cursor()
        
        # Update 'manager' to 'branch_manager'
        cursor.execute("UPDATE users SET role = 'branch_manager' WHERE role = 'manager'")
        print(f"Updated {cursor.rowcount} users from 'manager' to 'branch_manager'")
        
        conn.commit()
        conn.close()
        print("Role migration complete.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
