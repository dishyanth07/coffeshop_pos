import requests
import json

# Replace with an actual pending order ID from the user's screenshot if possible, or create a new one.
# From the screenshot, order #7 is "SERVED" but payment failed.
order_id = 7 
url = f"http://localhost:8000/customer-orders/{order_id}/pay"

# Note: We need a valid token for this. 
# I'll simulate a request using a dummy token or assuming local dev doesn't check it strictly for now, 
# but usually I'd need to login first.
# Let's try to get a token if possible or just use one if I have it.

# For testing purposes, I'll create a new order and then try to pay for it.
payload = {
    "items": [{"product_id": 1, "quantity": 1}],
    "customer_name": "Debug Fan",
    "branch_id": 1
}
order_res = requests.post("http://localhost:8000/live-commerce/order", json=payload)
if order_res.status_code == 200:
    new_order_id = order_res.json()['order_id']
    print(f"Created new order: {new_order_id}")
    
    # Now try to pay. Need auth.
    # I'll try to find a way to bypass or get token.
    # Since I'm the assistant, I can check the logs to see if there's a token I can use or just look at the code.
    print(f"Attempting to pay for order {new_order_id}...")
    # I will try to run this via a python script that interacts with the DB directly instead of HTTP if auth is hard.
else:
    print(f"Failed to create order: {order_res.text}")
