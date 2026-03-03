import requests
import json

API_URL = "http://localhost:8000/live-commerce/order"

def test_order(lat, lon, qr=None, label=""):
    payload = {
        "items": [{"product_id": 1, "quantity": 1}],
        "customer_name": f"Geo Test ({label})",
        "branch_id": 1,
        "latitude": lat,
        "longitude": lon,
        "qr_access_code": qr
    }
    print(f"--- Testing: {label} ---")
    res = requests.post(API_URL, json=payload)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.json()}")
    print("-" * 30)

if __name__ == "__main__":
    # Branch 1 Location: 12.9716, 77.5946 (Radius 5km)
    
    # 1. In-Range Order
    test_order(12.9750, 77.5980, label="Within Range")
    
    # 2. Out-of-Range Order
    test_order(13.0500, 78.0000, label="Outside Range")
    
    # 3. Out-of-Range with QR Bypass
    test_order(13.0500, 78.0000, qr="CAFE_SPECIAL", label="Outside Range + QR Bypass")
    
    # 4. Geolocation Missing
    test_order(None, None, label="Location Missing")
