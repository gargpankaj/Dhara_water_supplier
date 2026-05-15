from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class UserSummary(BaseModel):
    id: str
    full_name: str
    email: str
    role: str | None = None


class ContactCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=5, max_length=25)
    whatsapp: str | None = None
    email: str | None = None
    address: str | None = None
    gst_number: str | None = None
    notes: str | None = None
    is_client: bool = True
    is_supplier: bool = False
    credit_limit: Decimal = Decimal("0")


class ContactSummary(BaseModel):
    id: str
    full_name: str
    phone: str
    whatsapp: str | None = None
    address: str | None = None
    gst_number: str | None = None
    is_client: bool
    is_supplier: bool
    current_balance: Decimal = Decimal("0")
    pending_amount: Decimal = Decimal("0")
    advance_paid: Decimal = Decimal("0")
    credit_limit: Decimal = Decimal("0")
    last_payment_date: date | None = None


class ProductCreate(BaseModel):
    sku: str
    name: str
    category: str
    unit: str = "pcs"
    description: str | None = None
    barcode: str | None = None
    low_stock_threshold: int = 10
    stock_quantity: int = 0
    purchase_cost: Decimal = Decimal("0")
    wholesale_price: Decimal = Decimal("0")
    retail_price: Decimal = Decimal("0")
    distributor_price: Decimal = Decimal("0")
    premium_event_price: Decimal = Decimal("0")


class ProductRead(ProductCreate):
    id: str
    is_active: bool


class InventoryMovementCreate(BaseModel):
    product_id: str
    action: str
    quantity: int = Field(gt=0)
    batch_number: str | None = None
    unit_cost: Decimal | None = None
    notes: str | None = None


class PriceUpdateRequest(BaseModel):
    wholesale_price: Decimal | None = None
    retail_price: Decimal | None = None
    distributor_price: Decimal | None = None
    premium_event_price: Decimal | None = None
    purchase_cost: Decimal | None = None
    effective_date: datetime


class InvoiceItemInput(BaseModel):
    product_id: str | None = None
    description: str
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(gt=0)
    tax_percent: Decimal = Decimal("0")


class InvoiceCreate(BaseModel):
    invoice_type: str
    contact_id: str | None = None
    invoice_date: date
    due_date: date | None = None
    gst_enabled: bool = False
    discount_amount: Decimal = Decimal("0")
    notes: str | None = None
    items: list[InvoiceItemInput]


class InvoiceRead(BaseModel):
    id: str
    invoice_number: str
    invoice_type: str
    status: str
    invoice_date: date
    total_amount: Decimal
    amount_paid: Decimal
    amount_due: Decimal
    contact_name: str | None = None


class PaymentCreate(BaseModel):
    invoice_id: str | None = None
    contact_id: str | None = None
    amount: Decimal = Field(gt=0)
    payment_date: date
    method: str
    reference_no: str | None = None
    notes: str | None = None


class EventBookingCreate(BaseModel):
    client_contact_id: str
    event_type: str
    event_date: date
    venue: str
    quantity: int = Field(gt=0)
    delivery_time: str
    special_notes: str | None = None
    advance_payment: Decimal = Decimal("0")
    payment_schedule: str | None = None
    unit_price: Decimal = Decimal("0")


class ExpenseCreate(BaseModel):
    category: str
    description: str
    amount: Decimal = Field(gt=0)
    expense_date: date
    vendor_name: str | None = None


class NotificationRead(BaseModel):
    id: str
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

