import sqlite3
import os

db_path = 'coffeshop.db'

def patch_database():
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    columns_to_add = [
        ("latitude", "FLOAT"),
        ("longitude", "FLOAT"),
        ("radius", "FLOAT DEFAULT 5.0")
    ]

    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE branches ADD COLUMN {col_name} {col_type}")
            print(f"Added column {col_name} to branches table.")
        except sqlite3.OperationalError:
            print(f"Column {col_name} already exists in branches table.")

    # Set default values for first branch for testing purposes
    # Latitude: 12.9716, Longitude: 77.5946 (Bangalore)
    cursor.execute("UPDATE branches SET latitude = 12.9716, longitude = 77.5946, radius = 5.0 WHERE id = 1")
    
    conn.commit()
    conn.close()
    print("Migration completed.")

if __name__ == "__main__":
    patch_database()
