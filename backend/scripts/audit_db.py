import sys
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

def audit_database():
    print(f"--- Database Audit Start: {DATABASE_URL} ---")
    with engine.connect() as conn:
        # Check for SipSync leftovers in all text columns (heuristic)
        tables_res = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table';"))
        tables = [row[0] for row in tables_res]
        
        print(f"Found {len(tables)} tables.")
        
        for table in tables:
            print(f"Auditing table: {table}")
            try:
                # Check for SipSync in any column
                # This is a bit slow but thorough for a small POS db
                cols_res = conn.execute(text(f"PRAGMA table_info({table})"))
                cols = [row[1] for row in cols_res if row[2].lower() in ('text', 'string', 'varchar')]
                
                for col in cols:
                    res = conn.execute(text(f"SELECT COUNT(*) FROM {table} WHERE {col} LIKE '%SipSync%' COLLATE NOCASE"))
                    count = res.scalar()
                    if count > 0:
                        print(f"  [!] Found {count} 'SipSync' references in {table}.{col}")
            except Exception as e:
                print(f"  [Error] Could not audit {table}: {e}")

        # Check User roles consistency
        try:
            res = conn.execute(text("SELECT role, COUNT(*) FROM users GROUP BY role"))
            print("User roles distribution:")
            for row in res:
                print(f"  - {row[0]}: {row[1]}")
        except Exception as e:
            print(f"  [Error] User roles audit failed: {e}")

    print("--- Database Audit End ---")

if __name__ == "__main__":
    audit_database()
