import requests

def test_login(username, password):
    url = "http://localhost:8000/auth/token"
    data = {
        "username": username,
        "password": password
    }
    print(f"Testing login for {username}...")
    try:
        response = requests.post(url, data=data)
        if response.status_code == 200:
            print(f"✅ Login successful for {username}")
            print(f"Token: {response.json().get('access_token')[:20]}...")
        else:
            print(f"❌ Login failed for {username}: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error connecting to backend: {e}")

if __name__ == "__main__":
    test_login("admin", "admin123")
    test_login("owner", "ownerpassword")
    test_login("manager1", "managerpassword")
