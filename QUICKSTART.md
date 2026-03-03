# Coffee Shop POS - Quick Start Guide

## 🚀 Starting the Application

### Backend (FastAPI)
```bash
cd backend
venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
**Access**: http://localhost:8000/docs (Swagger UI)

### Frontend (React + Vite)
```bash
cd frontend
npm run dev
```
**Access**: Check terminal for port (usually http://localhost:5173 or 5176)

## 🔐 Default Credentials
- **Username**: `admin`
- **Password**: `admin123`

## 📁 Project Structure
```
coffeshop_pos/
├── backend/          # FastAPI backend
│   ├── app/
│   │   ├── api/      # API routes
│   │   ├── core/     # Security, database
│   │   ├── models/   # SQLAlchemy models
│   │   └── schemas/  # Pydantic schemas
│   ├── coffeshop.db  # SQLite database
│   └── venv/         # Python virtual environment
└── frontend/         # React frontend
    └── src/
        ├── pages/    # Login, POS, Inventory
        ├── services/ # API client (axios)
        └── context/  # Auth context
```

## 🛠️ Troubleshooting

### "Network Error" on Login
1. Ensure backend is running on port 8000
2. Kill all Python processes: `taskkill /F /IM python.exe`
3. Restart backend with command above
4. Clear browser cache or use incognito mode

### Port Already in Use
- Frontend will auto-increment (5173 → 5174 → 5175 → 5176)
- Update CORS in `backend/app/main.py` if needed

### No Products Showing
- Add products via Inventory page (`/inventory`) or Swagger UI
- Use `POST /products` endpoint to create products

## 📚 API Endpoints
- `POST /auth/token` - Login
- `GET /products` - List products
- `POST /products` - Create product
- `POST /inventory/{product_id}` - Update stock
- `POST /sales/billing` - Create sale

## 🎯 Features
- ✅ JWT Authentication
- ✅ Product Management
- ✅ Inventory Tracking
- ✅ POS Billing Interface
- ✅ Atomic Sales Transactions
- ✅ Responsive UI (Tailwind CSS v4)
