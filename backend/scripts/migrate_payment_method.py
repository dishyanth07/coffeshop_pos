import sqlite3
import os

# Check common database names found in the directory
db_files = ['coffeshop.db', 'pos.db', 'coffee_shop.db']

def migrate():
    for db_name in db_files:
        db_path = os.path.join(os.getcwd(), db_name)
        if not os.path.exists(db_path):
            continue

        print(f"Checking database: {db_name}")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        try:
            # Check if column already exists in 'sales' table
            cursor.execute("PRAGMA table_info(sales)")
            columns = [column[1] for column in cursor.fetchall()]
            
            if columns and 'payment_method' not in columns:
                print(f"Adding payment_method column to sales table in {db_name}...")
                cursor.execute("ALTER TABLE sales ADD COLUMN payment_method VARCHAR DEFAULT 'cash'")
                conn.commit()
                print(f"Migration successful for {db_name}.")
            elif not columns:
                print(f"Table 'sales' not found in {db_name}.")
            else:
                print(f"Column payment_method already exists in {db_name}.")
        except Exception as e:
            print(f"Error during migration of {db_name}: {e}")
        finally:
            conn.close()

if __name__ == "__main__":
    migrate()
