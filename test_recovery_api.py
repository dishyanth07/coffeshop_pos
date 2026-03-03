import requests

API_URL = "http://localhost:8000"
TOKEN = "YOUR_TOKEN_HERE" # Need to get this or bypass auth for testing

def test_recovery_endpoints():
    endpoints = [
        "/recovery/status",
        "/recovery/win-back",
        "/recovery/profit-optimization",
        "/recovery/reputation-repair",
        "/recovery/menu-optimization",
        "/recovery/staff-motivation"
    ]
    
    # We might need a valid token. Let's try to login as admin/admin123 first.
    try:
        login_res = requests.post(f"{API_URL}/auth/token", data={"username": "admin", "password": "admin123"})
        if login_res.status_code == 200:
            token = login_res.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            print("Login successful.")
        else:
            print(f"Login failed: {login_res.status_code} {login_res.text}")
            return
    except Exception as e:
        print(f"Login connection error: {e}")
        return

    for ep in endpoints:
        try:
            res = requests.get(f"{API_URL}{ep}", headers=headers)
            print(f"GET {ep}: {res.status_code}")
            if res.status_code != 200:
                print(f"Error detail: {res.text}")
        except Exception as e:
            print(f"Error hitting {ep}: {e}")

if __name__ == "__main__":
    test_recovery_endpoints()
