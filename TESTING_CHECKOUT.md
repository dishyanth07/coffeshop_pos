# Testing the Complete Checkout Flow

## Prerequisites
1. **Backend running** on `http://localhost:8000`
2. **Frontend running** on `http://localhost:5176` (or your current port)
3. **Logged in** as `admin` / `admin123`

## Test Scenario 1: Successful Checkout

### Steps:
1. **Navigate to POS** (`http://localhost:5176/pos`)
2. **Add products to cart**:
   - Click on any product card (e.g., "Espresso")
   - Product should appear in the "Current Order" panel on the right
   - Click again to add more quantity, or use the +/- buttons in the cart
3. **Verify cart calculations**:
   - Subtotal should update automatically
   - Total should match subtotal (Tax is 0%)
4. **Click "Checkout Now"**:
   - Button should show spinner and "Processing..." text
   - Button should be disabled during processing
5. **Verify success**:
   - Green toast notification: "✅ Payment Successful! Bill #X"
   - Cart should be cleared
   - Product stock should decrease (refresh page to verify)

### Expected Backend Behavior:
- Creates a `Sale` record with `total_amount`
- Creates `SaleItem` records for each cart item
- Deducts inventory quantities atomically
- Returns sale ID and total in response

---

## Test Scenario 2: Insufficient Stock

### Steps:
1. **Find a product with low stock** (check the stock badge on product cards)
2. **Add to cart with quantity > available stock**:
   - Click product multiple times OR
   - Use the + button in cart to increase quantity beyond stock
3. **Attempt checkout**:
   - Click "Checkout Now"
4. **Verify error handling**:
   - Red toast notification with specific error: "Insufficient stock for product X. Available: Y"
   - Cart should NOT be cleared
   - Stock should remain unchanged

### Expected Backend Behavior:
- Validates stock before creating sale
- Returns 400 error with detailed message
- Rolls back transaction (no partial updates)

---

## Test Scenario 3: Empty Cart

### Steps:
1. **Ensure cart is empty**
2. **Observe checkout button**:
   - Should be grayed out (`bg-gray-400`)
   - Should show "cursor-not-allowed"
   - Should be disabled (not clickable)

---

## Test Scenario 4: Multiple Items Checkout

### Steps:
1. **Add multiple different products** to cart:
   - Espresso x2
   - Cappuccino x1
   - Croissant x3
2. **Verify total calculation**:
   - Should be: (2 × $2.50) + (1 × $3.50) + (3 × $3.00) = $17.50
3. **Complete checkout**
4. **Verify in database** (optional):
   ```bash
   cd backend
   venv\Scripts\python
   ```
   ```python
   from app.core.database import SessionLocal
   from app.models.models import Sale, SaleItem
   db = SessionLocal()
   sale = db.query(Sale).order_by(Sale.id.desc()).first()
   print(f"Sale ID: {sale.id}, Total: ${sale.total_amount}")
   for item in sale.items:
       print(f"  - Product {item.product_id}: {item.quantity} @ ${item.price_at_sale}")
   ```

---

## Test Scenario 5: Network Error Handling

### Steps:
1. **Stop the backend server**:
   - Press Ctrl+C in the backend terminal
2. **Try to checkout** with items in cart
3. **Verify error handling**:
   - Red toast notification: "Network Error: No response received" or similar
   - Cart should NOT be cleared
   - Button should return to normal state after error

---

## Verification Checklist

### UI/UX
- [ ] Checkout button shows loading spinner during processing
- [ ] Button is disabled during checkout (prevents double-submission)
- [ ] Success toast shows bill number
- [ ] Error toast shows specific error message
- [ ] Cart clears only on successful checkout
- [ ] Product list refreshes after checkout (stock updates)

### Backend
- [ ] Stock validation happens before sale creation
- [ ] Inventory deduction is atomic (all-or-nothing)
- [ ] Sale and SaleItems are created correctly
- [ ] JWT token is required (401 if not authenticated)
- [ ] Proper error responses (400 for insufficient stock, 500 for server errors)

### Data Integrity
- [ ] Stock never goes negative
- [ ] Sale total matches sum of (quantity × price) for all items
- [ ] `price_at_sale` is captured (not affected by future price changes)
- [ ] Transaction rollback works on error

---

## API Testing (Optional)

### Using Swagger UI (`http://localhost:8000/docs`):

1. **Authenticate**:
   - POST `/auth/token`
   - Username: `admin`, Password: `admin123`
   - Copy the `access_token`

2. **Click "Authorize"** button (top right)
   - Paste token
   - Click "Authorize"

3. **Test Checkout**:
   - POST `/sales/billing`
   - Request body:
   ```json
   {
     "items": [
       {"product_id": 1, "quantity": 2},
       {"product_id": 2, "quantity": 1}
     ]
   }
   ```
   - Click "Execute"
   - Should return 200 with sale details

4. **Test Insufficient Stock**:
   - Use quantity > available stock
   - Should return 400 with error message

---

## Common Issues

### "Network Error" on Checkout
- **Cause**: Backend not running or wrong port
- **Fix**: Ensure backend is running on port 8000

### "401 Unauthorized"
- **Cause**: JWT token expired or missing
- **Fix**: Logout and login again

### Stock Not Updating
- **Cause**: Frontend cache
- **Fix**: Hard refresh (Ctrl+Shift+R) or check backend database directly

### Button Stuck in "Processing..."
- **Cause**: API call failed but error wasn't caught
- **Fix**: Check browser console for errors, refresh page
