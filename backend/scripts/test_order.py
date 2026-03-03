import requests
import json

url = "http://localhost:8000/live-commerce/order"
payload = {
    "items": [{"product_id": 1, "quantity": 1}],
    "customer_name": "Test Fan",
    "branch_id": 1
}

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
