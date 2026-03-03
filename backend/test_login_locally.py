import requests

url = "http://127.0.0.1:8000/auth/token"
payload = {
    "username": "admin",
    "password": "admin123"
}
headers = {
    "Content-Type": "application/x-www-form-urlencoded"
}

try:
    response = requests.post(url, data=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.json()}")
except Exception as e:
    print(f"Error: {e}")
