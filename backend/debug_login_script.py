import sqlite3
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

conn = sqlite3.connect('coffeshop.db')
cursor = conn.cursor()
cursor.execute('SELECT username, password_hash, role, branch_id FROM users')
users = cursor.fetchall()

print("Users in database:")
for user in users:
    username, hashed_password, role, branch_id = user
    is_valid = verify_password("admin123", hashed_password) if username == "admin" else "N/A"
    print(f"Username: {username}, Role: {role}, Branch: {branch_id}, Valid for 'admin123': {is_valid}")

conn.close()
