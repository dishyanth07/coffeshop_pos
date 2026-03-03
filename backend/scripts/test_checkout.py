import requests

# Get token
login_response = requests.post(
    "http://localhost:8000/auth/token",
    data={"username": "admin", "password": "admin123"}
)
token = login_response.json()["access_token"]
print(f"✅ Got token: {token[:50]}...")

# Test checkout
checkout_response = requests.post(
    "http://localhost:8000/sales/billing",
    json={"items": [{"product_id": 1, "quantity": 2}]},
    headers={"Authorization": f"Bearer {token}"}
)

print(f"\n📦 Checkout Response:")
print(f"Status Code: {checkout_response.status_code}")
if checkout_response.status_code == 200:
    data = checkout_response.json()
    print(f"✅ SUCCESS!")
    print(f"   Bill ID: {data['id']}")
    print(f"   Total: ${data['total_amount']}")
    print(f"   Created: {data['created_at']}")
else:
    print(f"❌ FAILED!")
    print(f"   Error: {checkout_response.text}")
