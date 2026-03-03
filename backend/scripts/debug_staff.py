import requests
import json

BASE_URL = "http://localhost:8000"

def get_token(username, password):
    res = requests.post(f"{BASE_URL}/auth/token", data={"username": username, "password": password})
    if res.status_code == 200:
        return res.json()["access_token"]
    print(f"Failed to get token: {res.status_code} - {res.text}")
    return None

def test_endpoint(endpoint, token):
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
    print(f"GET {endpoint}: {res.status_code}")
    if res.status_code != 200:
        print(f"Error: {res.text}")
    else:
        try:
            items = res.json()
            print(f"Success: {len(items)} items returned")
            if items:
                print(f"First item sample: {json.dumps(items[0], indent=2)}")
        except Exception as e:
            print(f"Failed to parse JSON: {e}")

def main():
    import sqlite3
    conn = sqlite3.connect("coffeshop.db")
    cursor = conn.cursor()
    cursor.execute("SELECT username FROM users WHERE role = 'branch_manager' LIMIT 1")
    manager = cursor.fetchone()
    if not manager:
        print("No manager found in DB")
        return
    username = manager[0]
    print(f"Testing with user: {username}")
    
    token = get_token(username, "debug123") # We previously set this to debug123
    if token:
        test_endpoint("/users/staff", token)

if __name__ == "__main__":
    main()
