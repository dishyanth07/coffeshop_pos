from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, products, inventory, sales, suppliers, raw_materials, purchase_orders, branches, transfers, reports, tables, customer_orders, fraud, assistant, recovery, users, live_commerce
from app.core.database import engine, Base
from app.models import models # Import models to ensure they are registered

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Power House - Smart POS")

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(products.router, prefix="/products", tags=["Products"])
app.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
app.include_router(sales.router, prefix="/sales", tags=["Sales"])
app.include_router(suppliers.router, prefix="/suppliers", tags=["Suppliers"])
app.include_router(raw_materials.router, prefix="/raw-materials", tags=["Raw Materials"])
app.include_router(purchase_orders.router, prefix="/purchase-orders", tags=["Purchase Orders"])
app.include_router(branches.router, prefix="/branches", tags=["Branches"])
app.include_router(transfers.router, prefix="/transfers", tags=["Stock Transfers"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(tables.router, prefix="/tables", tags=["Tables"])
app.include_router(customer_orders.router, prefix="/customer-orders", tags=["Customer Orders"])
app.include_router(fraud.router, prefix="/fraud", tags=["Fraud Detection"])
app.include_router(assistant.router, prefix="/assistant", tags=["AI Business Assistant"])
app.include_router(recovery.router, prefix="/recovery", tags=["Recovery Mode"])
app.include_router(users.router, prefix="/users", tags=["User Management"])
app.include_router(live_commerce.router, prefix="/live-commerce", tags=["Live Commerce"])

from app.core.websockets import manager
from fastapi import WebSocket, WebSocketDisconnect

@app.websocket("/ws/live-commerce")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Power House - Smart POS API"}
