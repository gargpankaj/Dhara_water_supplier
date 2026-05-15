from __future__ import annotations

import enum
import uuid
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class RoleName(str, enum.Enum):
    owner = "Owner"
    manager = "Manager"
    staff = "Staff"
    accountant = "Accountant"


class ProductCategory(str, enum.Enum):
    raw_material = "raw_material"
    finished_good = "finished_good"
    premium = "premium"


class InventoryAction(str, enum.Enum):
    add = "add"
    remove = "remove"
    transfer = "transfer"
    damaged = "damaged"
    adjustment = "adjustment"
    sold = "sold"
    purchased = "purchased"


class InvoiceType(str, enum.Enum):
    sale = "sale"
    purchase = "purchase"
    return_invoice = "return"


class InvoiceStatus(str, enum.Enum):
    draft = "draft"
    paid = "paid"
    partial = "partial"
    pending = "pending"
    overdue = "overdue"


class PaymentMethod(str, enum.Enum):
    cash = "cash"
    upi = "upi"
    bank = "bank"
    cheque = "cheque"


class EventType(str, enum.Enum):
    wedding = "wedding"
    corporate = "corporate"
    private_party = "private_party"
    exhibition = "exhibition"
    other = "other"


class Role(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "roles"

    name: Mapped[RoleName] = mapped_column(
        Enum(
            RoleName,
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
            native_enum=False,
        ),
        unique=True,
        nullable=False,
    )
    description: Mapped[str] = mapped_column(String(255), default="")

    users: Mapped[list["User"]] = relationship(back_populates="role")


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"

    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[str | None] = mapped_column(String(25))
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    role_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("roles.id"), nullable=False, index=True)

    role: Mapped["Role"] = relationship(back_populates="users", lazy="joined")


class Contact(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "contacts"

    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(String(25), index=True, nullable=False)
    whatsapp: Mapped[str | None] = mapped_column(String(25))
    email: Mapped[str | None] = mapped_column(String(255))
    address: Mapped[str | None] = mapped_column(Text)
    gst_number: Mapped[str | None] = mapped_column(String(40))
    notes: Mapped[str | None] = mapped_column(Text)

    client_profile: Mapped["ClientProfile | None"] = relationship(back_populates="contact")
    supplier_profile: Mapped["SupplierProfile | None"] = relationship(back_populates="contact")


class ClientProfile(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "clients"

    contact_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("contacts.id"), unique=True, nullable=False)
    current_balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    pending_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    advance_paid: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    credit_limit: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    last_payment_date: Mapped[Date | None] = mapped_column(Date)

    contact: Mapped["Contact"] = relationship(back_populates="client_profile")


class SupplierProfile(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "suppliers"

    contact_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("contacts.id"), unique=True, nullable=False)
    current_balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    pending_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    advance_paid: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    credit_limit: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    last_payment_date: Mapped[Date | None] = mapped_column(Date)

    contact: Mapped["Contact"] = relationship(back_populates="supplier_profile")


class Product(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "products"

    sku: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    category: Mapped[ProductCategory] = mapped_column(
        Enum(ProductCategory, native_enum=False), nullable=False
    )
    unit: Mapped[str] = mapped_column(String(20), default="pcs")
    description: Mapped[str | None] = mapped_column(Text)
    barcode: Mapped[str | None] = mapped_column(String(100), index=True)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=10)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0)
    purchase_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    wholesale_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    retail_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    distributor_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    premium_event_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    inventory_logs: Mapped[list["InventoryLog"]] = relationship(back_populates="product")
    price_history: Mapped[list["PriceHistory"]] = relationship(back_populates="product")


class InventoryLog(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "inventory_logs"

    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    action: Mapped[InventoryAction] = mapped_column(
        Enum(InventoryAction, native_enum=False), nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    batch_number: Mapped[str | None] = mapped_column(String(80))
    unit_cost: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    notes: Mapped[str | None] = mapped_column(Text)
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))

    product: Mapped["Product"] = relationship(back_populates="inventory_logs")


class PriceHistory(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "price_history"

    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    price_type: Mapped[str] = mapped_column(String(40), nullable=False)
    old_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    new_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    effective_date: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    changed_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))

    product: Mapped["Product"] = relationship(back_populates="price_history")


class Invoice(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "invoices"

    invoice_number: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    invoice_type: Mapped[InvoiceType] = mapped_column(
        Enum(InvoiceType, native_enum=False), nullable=False
    )
    status: Mapped[InvoiceStatus] = mapped_column(
        Enum(InvoiceStatus, native_enum=False), default=InvoiceStatus.pending
    )
    contact_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("contacts.id"), index=True)
    invoice_date: Mapped[Date] = mapped_column(Date, nullable=False)
    due_date: Mapped[Date | None] = mapped_column(Date)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    amount_paid: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    amount_due: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    gst_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[str | None] = mapped_column(Text)
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))

    contact: Mapped["Contact | None"] = relationship()
    items: Mapped[list["InvoiceItem"]] = relationship(
        back_populates="invoice", cascade="all, delete-orphan"
    )
    payments: Mapped[list["Payment"]] = relationship(back_populates="invoice")


class InvoiceItem(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "invoice_items"

    invoice_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("invoices.id"), nullable=False)
    product_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("products.id"))
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    tax_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0)
    line_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    invoice: Mapped["Invoice"] = relationship(back_populates="items")
    product: Mapped["Product | None"] = relationship()


class Payment(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "payments"

    invoice_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("invoices.id"), index=True)
    contact_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("contacts.id"), index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    payment_date: Mapped[Date] = mapped_column(Date, nullable=False)
    method: Mapped[PaymentMethod] = mapped_column(
        Enum(PaymentMethod, native_enum=False), nullable=False
    )
    reference_no: Mapped[str | None] = mapped_column(String(100))
    notes: Mapped[str | None] = mapped_column(Text)
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))

    invoice: Mapped["Invoice | None"] = relationship(back_populates="payments")
    contact: Mapped["Contact | None"] = relationship()


class Expense(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "expenses"

    category: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    expense_date: Mapped[Date] = mapped_column(Date, nullable=False)
    vendor_name: Mapped[str | None] = mapped_column(String(120))
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))


class EventBooking(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "event_bookings"

    client_contact_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("contacts.id"), nullable=False)
    event_type: Mapped[EventType] = mapped_column(
        Enum(EventType, native_enum=False), nullable=False
    )
    event_date: Mapped[Date] = mapped_column(Date, nullable=False)
    venue: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    delivery_time: Mapped[str] = mapped_column(String(50), nullable=False)
    special_notes: Mapped[str | None] = mapped_column(Text)
    advance_payment: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    remaining_due: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    payment_schedule: Mapped[str | None] = mapped_column(Text)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))

    client_contact: Mapped["Contact"] = relationship()


class Notification(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "notifications"

    title: Mapped[str] = mapped_column(String(120), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), index=True)
    related_entity_type: Mapped[str | None] = mapped_column(String(50))
    related_entity_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)


class AuditLog(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "audit_logs"

    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), index=True)
    action: Mapped[str] = mapped_column(String(120), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(80), nullable=False)
    entity_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    metadata_json: Mapped[str | None] = mapped_column(Text)


class PasswordResetToken(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "password_reset_tokens"
    __table_args__ = (UniqueConstraint("email", "otp_code", name="uq_password_reset_email_otp"),)

    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    otp_code: Mapped[str] = mapped_column(String(6), nullable=False)
    expires_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False)
