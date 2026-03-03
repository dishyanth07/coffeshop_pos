import requests

# Get token
login_response = requests.post(
    "http://localhost:8000/auth/token",
    data={"username": "admin", "password": "admin123"}
)
token = login_response.json()["access_token"]
print(f"✅ Got token: {token[:50]}...")

# Test sales history endpoint
print("\n📊 Testing Sales History Endpoint:")
print("="*50)

# Test 1: Get all sales
response = requests.get(
    "http://localhost:8000/sales/history",
    headers={"Authorization": f"Bearer {token}"}
)

print(f"\n1. All Sales:")
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print(f"   ✅ Total Sales: ${data['total_sales']}")
    print(f"   ✅ Total Orders: {data['total_orders']}")
    print(f"   ✅ Sales Count: {len(data['sales'])}")
    if data['sales']:
        print(f"\n   Recent Sales:")
        for sale in data['sales'][:3]:
            print(f"      - Bill #{sale['id']}: ${sale['total_amount']} by {sale['cashier']}")
else:
    print(f"   ❌ Error: {response.text}")

# Test 2: Filter by date
from datetime import date, timedelta
today = date.today()
week_ago = today - timedelta(days=7)

response2 = requests.get(
    "http://localhost:8000/sales/history",
    params={"start_date": str(week_ago), "end_date": str(today)},
    headers={"Authorization": f"Bearer {token}"}
)

print(f"\n2. Last 7 Days:")
print(f"   Status: {response2.status_code}")
if response2.status_code == 200:
    data2 = response2.json()
    print(f"   ✅ Total Sales: ${data2['total_sales']}")
    print(f"   ✅ Total Orders: {data2['total_orders']}")
else:
    print(f"   ❌ Error: {response2.text}")
