import sqlite3
import os

DB_PATH = 'coffeshop.db'

def run_migration():
    if not os.path.exists(DB_PATH):
        print(f"Error: {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("Checking 'sales' table columns...")
    cursor.execute("PRAGMA table_info(sales)")
    columns = [col[1] for col in cursor.fetchall()]
    
    new_cols = [
        ("status", "TEXT DEFAULT 'completed'"),
        ("discount_amount", "REAL DEFAULT 0.0"),
        ("discount_reason", "TEXT"),
        ("void_reason", "TEXT"),
        ("voided_at", "TIMESTAMP"),
        ("voided_by_id", "INTEGER")
    ]

    for col_name, col_def in new_cols:
        if col_name not in columns:
            print(f"Adding column '{col_name}' to 'sales'...")
            cursor.execute(f"ALTER TABLE sales ADD COLUMN {col_name} {col_def}")
        else:
            print(f"Column '{col_name}' already exists.")

    # Ensure new tables exist (though create_all should handle this if main.py is restarted)
    print("Ensuring new security tables exist...")
    
    # Audit Logs
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id INTEGER,
        details TEXT,
        branch_id INTEGER NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(branch_id) REFERENCES branches(id)
    )
    """)

    # Fraud Flags
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS fraud_flags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        branch_id INTEGER NOT NULL,
        risk_score INTEGER DEFAULT 0,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(branch_id) REFERENCES branches(id)
    )
    """)

    # Cash Reconciliation
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cash_reconciliations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        branch_id INTEGER NOT NULL,
        expected_amount REAL NOT NULL,
        actual_amount REAL NOT NULL,
        difference REAL NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(branch_id) REFERENCES branches(id)
    )
    """)

    # Stock Count
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS stock_counts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        branch_id INTEGER NOT NULL,
        expected_stock INTEGER NOT NULL,
        actual_stock INTEGER NOT NULL,
        difference INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(product_id) REFERENCES products(id),
        FOREIGN KEY(branch_id) REFERENCES branches(id),
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)

    conn.commit()
    conn.close()
    print("Migration completed successfully!")

if __name__ == "__main__":
    run_migration()
