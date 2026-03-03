import requests

# Get token
login_response = requests.post(
    "http://localhost:8000/auth/token",
    data={"username": "admin", "password": "admin123"}
)
token = login_response.json()["access_token"]
print(f"✅ Got token")

# Test low stock endpoint
print("\n📊 Testing Low Stock Alert System:")
print("="*50)

response = requests.get(
    "http://localhost:8000/inventory/low-stock",
    headers={"Authorization": f"Bearer {token}"}
)

print(f"\nStatus: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"✅ Low Stock Items: {len(data)}")
    if data:
        print("\nProducts Running Low:")
        for item in data:
            print(f"  - {item['product_name']}: {item['current_stock']} (reorder at {item['reorder_level']}, shortage: {item['shortage']})")
    else:
        print("  No low stock items")
else:
    print(f"❌ Error: {response.text}")

# Test inventory endpoint
print("\n\n📦 Testing Inventory Endpoint:")
print("="*50)

response2 = requests.get(
    "http://localhost:8000/inventory",
    headers={"Authorization": f"Bearer {token}"}
)

print(f"\nStatus: {response2.status_code}")
if response2.status_code == 200:
    data2 = response2.json()
    print(f"✅ Total Inventory Items: {len(data2)}")
    if data2:
        print("\nInventory:")
        for item in data2[:5]:  # Show first 5
            print(f"  - {item['product_name']}: {item['quantity']} (reorder: {item['reorder_level']})")
else:
    print(f"❌ Error: {response2.text}")
