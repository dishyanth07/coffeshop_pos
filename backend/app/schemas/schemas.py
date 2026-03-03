from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import enum
from app.models.models import UserRole, PaymentMethod

class UserBase(BaseModel):
    username: str
    role: UserRole = UserRole.CASHIER
    branch_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    require_password_change: bool

    class Config:
        from_attributes = True

class UserPasswordChange(BaseModel):
    old_password: str
    new_password: str

# --- Branch Schemas ---
class BranchBase(BaseModel):
    name: str
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius: Optional[float] = 5.0
    is_active: bool = True

class BranchCreate(BranchBase):
    owner_id: int

class BranchUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius: Optional[float] = None
    is_active: Optional[bool] = None

class BranchResponse(BranchBase):
    id: int
    owner_id: int

    class Config:
        from_attributes = True

class BranchCreateResponse(BranchResponse):
    manager_username: str
    manager_password: str

# --- Customer Schemas ---
class CustomerBase(BaseModel):
    phone: str
    name: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- Product Schemas ---
class RecipeItemCreate(BaseModel):
    raw_material_id: int
    quantity: float

class RecipeItemResponse(BaseModel):
    raw_material_id: int
    raw_material_name: str
    quantity: float
    unit: str

    class Config:
        from_attributes = True

class CustomizationCreate(BaseModel):
    name: str
    extra_price: float
    raw_material_id: Optional[int] = None
    quantity: float = 0.0

class CustomizationResponse(BaseModel):
    id: int
    name: str
    extra_price: float
    raw_material_id: Optional[int] = None
    raw_material_name: Optional[str] = None
    quantity: float

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category: Optional[str] = None
    branch_id: Optional[int] = None

class ProductCreate(ProductBase):
    recipe_items: Optional[List[RecipeItemCreate]] = None
    customizations: Optional[List[CustomizationCreate]] = None

class ProductResponse(ProductBase):
    id: int
    stock: int  # Computed field
    recipe_items: List[RecipeItemResponse] = []
    customizations: List[CustomizationResponse] = []

    class Config:
        from_attributes = True

# --- Inventory Schemas ---
class InventoryUpdate(BaseModel):
    quantity: Optional[int] = None
    reorder_level: Optional[int] = None

class InventoryResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    quantity: int
    reorder_level: int
    branch_id: int

class LowStockItem(BaseModel):
    product_id: int
    product_name: str
    current_stock: int
    reorder_level: int
    shortage: int

# --- Supplier Schemas ---
class SupplierBase(BaseModel):
    name: str
    contact_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierResponse(SupplierBase):
    id: int

    class Config:
        from_attributes = True

# --- Raw Material Schemas ---
class RawMaterialBase(BaseModel):
    name: str
    unit: str
    stock: float = 0.0
    min_level: float = 5.0
    supplier_id: Optional[int] = None
    branch_id: Optional[int] = None

class RawMaterialCreate(RawMaterialBase):
    pass

class RawMaterialResponse(RawMaterialBase):
    id: int
    supplier_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Purchase Order Schemas ---
class POItemCreate(BaseModel):
    raw_material_id: int
    quantity: float
    unit_price: float

class POItemResponse(BaseModel):
    id: int
    raw_material_id: int
    raw_material_name: str
    quantity: float
    unit_price: float

    class Config:
        from_attributes = True

class POCreate(BaseModel):
    supplier_id: int
    items: List[POItemCreate]

class POResponse(BaseModel):
    id: int
    supplier_id: int
    supplier_name: str
    status: str
    total_amount: float
    created_at: datetime
    branch_id: int
    items: List[POItemResponse]

    class Config:
        from_attributes = True

# --- Stock Transfer Schemas ---
class StockTransferCreate(BaseModel):
    to_branch_id: int
    raw_material_id: int
    quantity: float

class StockTransferResponse(BaseModel):
    id: int
    from_branch_id: int
    from_branch_name: str
    to_branch_id: int
    to_branch_name: str
    raw_material_id: int
    raw_material_name: str
    quantity: float
    unit: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Sale Schemas ---
class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int
    customization_ids: Optional[List[int]] = None

    class Config:
        from_attributes = True

class SaleItemCustomizationResponse(BaseModel):
    customization_id: int
    name: str
    price_at_sale: float

    class Config:
        from_attributes = True

class SaleItemResponse(BaseModel):
    product_id: int
    quantity: int
    price_at_sale: float
    product_name: Optional[str] = None
    customizations: List[SaleItemCustomizationResponse] = []

    class Config:
        from_attributes = True

class SaleCreate(BaseModel):
    items: List[SaleItemCreate]
    customer_phone: Optional[str] = None
    customer_name: Optional[str] = None
    payment_method: PaymentMethod = PaymentMethod.CASH
    discount_amount: float = 0.0
    discount_reason: Optional[str] = None
    amount_received: float = 0.0
    change_amount: float = 0.0

class PaymentRequest(BaseModel):
    payment_method: PaymentMethod

class SaleVoidRequest(BaseModel):
    void_reason: str

class SaleResponse(BaseModel):
    id: int
    total_amount: float
    status: str
    discount_amount: float
    discount_reason: Optional[str] = None
    void_reason: Optional[str] = None
    voided_at: Optional[datetime] = None
    voided_by_id: Optional[int] = None
    created_at: datetime
    branch_id: int
    customer: Optional[CustomerResponse] = None
    whatsapp_url: Optional[str] = None
    source: str = "pos"
    payment_method: PaymentMethod = PaymentMethod.CASH
    amount_received: float = 0.0
    change_amount: float = 0.0

    class Config:
        from_attributes = True

# --- Sales History Schemas ---
class SaleListItem(BaseModel):
    id: int
    total_amount: float
    created_at: datetime
    cashier: str

class SalesStats(BaseModel):
    total_sales: float
    total_orders: int

class SaleHistoryResponse(BaseModel):
    total_sales: float
    total_orders: int
    sales: List[SaleListItem]

# --- Customer List Schemas ---
class CustomerSummaryResponse(BaseModel):
    id: int
    phone: str
    name: Optional[str] = None
    order_count: int
    total_spent: float
    last_order_date: Optional[datetime] = None

    class Config:
        from_attributes = True

class CustomerListResponse(BaseModel):
    customers: List[CustomerSummaryResponse]

# --- QR Ordering / Table Schemas ---
class TableBase(BaseModel):
    table_number: str
    is_active: bool = True

class TableCreate(TableBase):
    branch_id: int

class TableResponse(TableBase):
    id: int
    branch_id: int
    qr_url: Optional[str] = None # Helper for frontend

    class Config:
        from_attributes = True

# --- Customer Order Schemas ---
class CustomerOrderItemBase(BaseModel):
    product_id: int
    quantity: int

class CustomerOrderItemCreate(CustomerOrderItemBase):
    pass

class CustomerOrderItemResponse(CustomerOrderItemBase):
    id: int
    product_name: str
    price_at_order: float

    class Config:
        from_attributes = True

class CustomerOrderBase(BaseModel):
    table_id: Optional[int] = None
    branch_id: int
    source: str = "pos"
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None

class CustomerOrderCreate(CustomerOrderBase):
    items: List[CustomerOrderItemCreate]

class CustomerOrderResponse(CustomerOrderBase):
    id: int
    status: str
    total_amount: float
    created_at: datetime
    table_number: Optional[str] = "LIVE"
    items: List[CustomerOrderItemResponse]

    class Config:
        from_attributes = True

class CustomerOrderStatusUpdate(BaseModel):
    status: str

# --- Audit Log Schemas ---
class AuditLogResponse(BaseModel):
    id: int
    user_id: int
    username: str
    action: str
    target_type: str
    target_id: Optional[int] = None
    details: Optional[str] = None
    branch_id: int
    timestamp: datetime

    class Config:
        from_attributes = True

# --- Fraud Flag Schemas ---
class FraudFlagResponse(BaseModel):
    id: int
    user_id: int
    username: str
    branch_id: int
    risk_score: int
    reason: str
    status: str
    timestamp: datetime

    class Config:
        from_attributes = True

class FraudFlagResolve(BaseModel):
    status: str = "resolved"

# --- Cash Reconciliation Schemas ---
class CashReconciliationCreate(BaseModel):
    expected_amount: float
    actual_amount: float

class CashReconciliationResponse(BaseModel):
    id: int
    user_id: int
    username: str
    branch_id: int
    expected_amount: float
    actual_amount: float
    difference: float
    timestamp: datetime

    class Config:
        from_attributes = True

# --- Stock Count Schemas ---
class StockCountCreate(BaseModel):
    product_id: int
    expected_stock: int
    actual_stock: int

class StockCountResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    branch_id: int
    expected_stock: int
    actual_stock: int
    difference: int
    user_id: int
    username: str
    timestamp: datetime

    class Config:
        from_attributes = True

# --- Assistant Schemas ---
class AssistantQuery(BaseModel):
    query: str

class AssistantMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    timestamp: datetime

    class Config:
        from_attributes = True

class AssistantResponse(BaseModel):
    response: str
    metrics: Optional[dict] = None

# --- Live Commerce Schemas ---
class LiveCommerceStats(BaseModel):
    total_live_sales: float
    live_order_count: int

class LiveCommerceOrder(BaseModel):
    items: List[SaleItemCreate] # Reusing SaleItemCreate
    customer_name: Optional[str] = "Live Viewer"
    customer_phone: Optional[str] = None
    branch_id: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    qr_access_code: Optional[str] = None
