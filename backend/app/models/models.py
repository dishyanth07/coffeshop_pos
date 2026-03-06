from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base

class UserRole(str, enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MANAGER = "manager"
    CASHIER = "cashier"

class PurchaseOrderStatus(str, enum.Enum):
    PENDING = "pending"
    ORDERED = "ordered"
    RECEIVED = "received"
    CANCELLED = "cancelled"

class StockTransferStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    SHIPPED = "shipped"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class CustomerOrderStatus(str, enum.Enum):
    PENDING = "pending"
    PREPARING = "preparing"
    SERVED = "served"
    PAID = "paid"
    CANCELLED = "cancelled"

class SaleStatus(str, enum.Enum):
    COMPLETED = "completed"
    VOIDED = "voided"

class FraudFlagStatus(str, enum.Enum):
    OPEN = "open"
    RESOLVED = "resolved"

class SaleSource(str, enum.Enum):
    POS = "pos"
    LIVE_COMMERCE = "live_commerce"

class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    CARD = "card"
    UPI = "upi"

class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    location = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    radius = Column(Float, default=5.0) # Range in KM
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)

    owner = relationship("User", back_populates="owned_branches", foreign_keys=[owner_id])
    users = relationship("User", back_populates="branch", foreign_keys="User.branch_id")
    products = relationship("Product", back_populates="branch")
    inventory = relationship("Inventory", back_populates="branch")
    raw_materials = relationship("RawMaterial", back_populates="branch")
    sales = relationship("Sale", back_populates="branch")
    purchase_orders = relationship("PurchaseOrder", back_populates="branch")
    tables = relationship("Table", back_populates="branch")
    customer_orders = relationship("CustomerOrder", back_populates="branch")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(SQLAlchemyEnum(UserRole, values_callable=lambda x: [e.value for e in x]), default=UserRole.CASHIER)
    is_active = Column(Boolean, default=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    require_password_change = Column(Boolean, default=False)

    branch = relationship("Branch", back_populates="users", foreign_keys=[branch_id])
    owned_branches = relationship("Branch", back_populates="owner", foreign_keys=[Branch.owner_id])

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    category = Column(String, index=True, nullable=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)

    branch = relationship("Branch", back_populates="products")
    inventory = relationship("Inventory", back_populates="product", uselist=False, cascade="all, delete-orphan")
    recipe_items = relationship("ProductRecipe", back_populates="product", cascade="all, delete-orphan")
    customizations = relationship("ProductCustomization", back_populates="product", cascade="all, delete-orphan")
    sale_items = relationship("SaleItem", back_populates="product", cascade="all, delete-orphan")
    customer_order_items = relationship("CustomerOrderItem", back_populates="product", cascade="all, delete-orphan")

class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), unique=True, nullable=False)
    quantity = Column(Integer, default=0, nullable=False)
    reorder_level = Column(Integer, default=10, nullable=False)  # Minimum stock before alert
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)

    branch = relationship("Branch", back_populates="inventory")
    product = relationship("Product", back_populates="inventory")

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    contact_name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)

    raw_materials = relationship("RawMaterial", back_populates="supplier")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True) # Global suppliers might exist initially
    branch = relationship("Branch")

class RawMaterial(Base):
    __tablename__ = "raw_materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    unit = Column(String, nullable=False) # e.g., "kg", "liter", "pcs"
    stock = Column(Float, default=0.0, nullable=False)
    min_level = Column(Float, default=5.0, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)

    branch = relationship("Branch", back_populates="raw_materials")
    supplier = relationship("Supplier", back_populates="raw_materials")
    recipe_usages = relationship("ProductRecipe", back_populates="raw_material", cascade="all, delete-orphan")
    customization_usages = relationship("ProductCustomization", back_populates="raw_material")
    purchase_order_items = relationship("PurchaseOrderItem", back_populates="raw_material", cascade="all, delete-orphan")

class ProductRecipe(Base):
    __tablename__ = "product_recipes"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    raw_material_id = Column(Integer, ForeignKey("raw_materials.id"), nullable=False)
    quantity = Column(Float, nullable=False)

    product = relationship("Product", back_populates="recipe_items")
    raw_material = relationship("RawMaterial", back_populates="recipe_usages")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    status = Column(SQLAlchemyEnum(PurchaseOrderStatus, values_callable=lambda x: [e.value for e in x]), default=PurchaseOrderStatus.PENDING)
    total_amount = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)

    branch = relationship("Branch", back_populates="purchase_orders")
    supplier = relationship("Supplier", back_populates="purchase_orders")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")

class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    raw_material_id = Column(Integer, ForeignKey("raw_materials.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)

    purchase_order = relationship("PurchaseOrder", back_populates="items")
    raw_material = relationship("RawMaterial", back_populates="purchase_order_items")

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    phone = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True) # For cross-branch customers or legacy data
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    branch = relationship("Branch")

    sales = relationship("Sale", back_populates="customer")

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    total_amount = Column(Float, nullable=False)
    status = Column(SQLAlchemyEnum(SaleStatus, values_callable=lambda x: [e.value for e in x]), default=SaleStatus.COMPLETED)
    discount_amount = Column(Float, default=0.0)
    discount_reason = Column(String, nullable=True)
    void_reason = Column(String, nullable=True)
    voided_at = Column(DateTime(timezone=True), nullable=True)
    voided_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=True)
    source = Column(SQLAlchemyEnum(SaleSource, values_callable=lambda x: [e.value for e in x]), default=SaleSource.POS)
    payment_method = Column(SQLAlchemyEnum(PaymentMethod, values_callable=lambda x: [e.value for e in x]), default=PaymentMethod.CASH)
    amount_received = Column(Float, default=0.0)
    change_amount = Column(Float, default=0.0)

    branch = relationship("Branch", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale")
    user = relationship("User", foreign_keys=[user_id])
    voided_by = relationship("User", foreign_keys=[voided_by_id])
    customer = relationship("Customer", back_populates="sales")

class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price_at_sale = Column(Float, nullable=False)

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product", back_populates="sale_items")
    customizations = relationship("SaleItemCustomization", back_populates="sale_item", cascade="all, delete-orphan")

class StockTransfer(Base):
    __tablename__ = "stock_transfers"

    id = Column(Integer, primary_key=True, index=True)
    from_branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    to_branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    raw_material_id = Column(Integer, ForeignKey("raw_materials.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    status = Column(SQLAlchemyEnum(StockTransferStatus, values_callable=lambda x: [e.value for e in x]), default=StockTransferStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    from_branch = relationship("Branch", foreign_keys=[from_branch_id])
    to_branch = relationship("Branch", foreign_keys=[to_branch_id])
    raw_material = relationship("RawMaterial")

class Table(Base):
    __tablename__ = "tables"

    id = Column(Integer, primary_key=True, index=True)
    table_number = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)

    branch = relationship("Branch", back_populates="tables")
    orders = relationship("CustomerOrder", back_populates="table", cascade="all, delete-orphan")

class CustomerOrder(Base):
    __tablename__ = "customer_orders"

    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey("tables.id"), nullable=True)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    source = Column(SQLAlchemyEnum(SaleSource, values_callable=lambda x: [e.value for e in x]), default=SaleSource.POS)
    status = Column(SQLAlchemyEnum(CustomerOrderStatus, values_callable=lambda x: [e.value for e in x]), default=CustomerOrderStatus.PENDING)
    total_amount = Column(Float, nullable=False)
    customer_name = Column(String, nullable=True) # Optional for self-order
    customer_phone = Column(String, nullable=True) # For WhatsApp receipts
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    table = relationship("Table", back_populates="orders")
    branch = relationship("Branch", back_populates="customer_orders")
    items = relationship("CustomerOrderItem", back_populates="order", cascade="all, delete-orphan")

class CustomerOrderItem(Base):
    __tablename__ = "customer_order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("customer_orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price_at_order = Column(Float, nullable=False)

    order = relationship("CustomerOrder", back_populates="items")
    product = relationship("Product", back_populates="customer_order_items")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False) # e.g., "bill_creation", "void", "discount"
    target_type = Column(String, nullable=False) # e.g., "sale", "product"
    target_id = Column(Integer, nullable=True)
    details = Column(String, nullable=True) # JSON string
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    branch = relationship("Branch")

class FraudFlag(Base):
    __tablename__ = "fraud_flags"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    risk_score = Column(Integer, default=0)
    reason = Column(String, nullable=False)
    status = Column(SQLAlchemyEnum(FraudFlagStatus, values_callable=lambda x: [e.value for e in x]), default=FraudFlagStatus.OPEN)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    branch = relationship("Branch")

class CashReconciliation(Base):
    __tablename__ = "cash_reconciliations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    expected_amount = Column(Float, nullable=False)
    actual_amount = Column(Float, nullable=False)
    difference = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    branch = relationship("Branch")

class StockCount(Base):
    __tablename__ = "stock_counts"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"), nullable=False)
    expected_stock = Column(Integer, nullable=False)
    actual_stock = Column(Integer, nullable=False)
    difference = Column(Integer, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product")
    branch = relationship("Branch")
    user = relationship("User")

class ProductCustomization(Base):
    __tablename__ = "product_customizations"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    name = Column(String, nullable=False) # e.g., "Extra Milk"
    extra_price = Column(Float, default=0.0)
    raw_material_id = Column(Integer, ForeignKey("raw_materials.id"), nullable=True)
    quantity = Column(Float, default=0.0)

    product = relationship("Product", back_populates="customizations")
    raw_material = relationship("RawMaterial", back_populates="customization_usages")

class SaleItemCustomization(Base):
    __tablename__ = "sale_item_customizations"

    id = Column(Integer, primary_key=True, index=True)
    sale_item_id = Column(Integer, ForeignKey("sale_items.id"), nullable=False)
    customization_id = Column(Integer, ForeignKey("product_customizations.id"), nullable=False)
    price_at_sale = Column(Float, nullable=False)

    sale_item = relationship("SaleItem", back_populates="customizations")
    customization = relationship("ProductCustomization")

class AssistantMessage(Base):
    __tablename__ = "assistant_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False) # "user" or "assistant"
    content = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
