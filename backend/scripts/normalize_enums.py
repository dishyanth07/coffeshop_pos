import sqlite3
import os
from dotenv import load_dotenv

def normalize_database():
    load_dotenv()
    db_url = os.getenv("DATABASE_URL", "sqlite:///./coffeshop.db")
    
    # Extract path from sqlite:///./coffeshop.db
    if db_url.startswith("sqlite:///"):
        db_path = db_url.replace("sqlite:///", "")
    else:
        print(f"Skipping normalization for non-sqlite URL: {db_url}")
        return

    print(f"Normalizing database at: {db_path}")
    
    if not os.path.exists(db_path):
        print(f"Error: Database file not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # List of tables and columns to normalize
    normalization_map = {
        "users": ["role"],
        "purchase_orders": ["status"],
        "sales": ["status"],
        "stock_transfers": ["status"],
        "customer_orders": ["status"],
        "fraud_flags": ["status"]
    }

    try:
        for table, columns in normalization_map.items():
            for column in columns:
                print(f"Normalizing {table}.{column}...")
                # Update all values to lowercase
                cursor.execute(f"UPDATE {table} SET {column} = LOWER({column})")
        
        conn.commit()
        print("Normalization complete successfully!")
        
        # Verify a count
        cursor.execute("SELECT DISTINCT status FROM sales")
        statuses = cursor.fetchall()
        print(f"Current distinct Sales statuses: {statuses}")

    except sqlite3.OperationalError as e:
        print(f"Operational error: {e} (Table might not exist yet)")
    except Exception as e:
        print(f"An error occurred: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    normalize_database()
