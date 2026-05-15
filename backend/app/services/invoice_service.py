from datetime import date
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.entities import (
    ClientProfile,
    Contact,
    InventoryAction,
    InventoryLog,
    Invoice,
    InvoiceItem,
    InvoiceStatus,
    InvoiceType,
    Notification,
    Product,
    SupplierProfile,
    User,
)
from app.schemas.domain import InvoiceCreate
from app.utils.audit import create_audit_log
from app.utils.whatsapp import build_whatsapp_link


class InvoiceService:
    @staticmethod
    async def create_invoice(db: AsyncSession, payload: InvoiceCreate, actor: User) -> Invoice:
        invoice_type = InvoiceType(payload.invoice_type)
        contact = None
        if payload.contact_id:
            contact = (
                await db.execute(select(Contact).where(Contact.id == payload.contact_id).limit(1))
            ).scalar_one_or_none()
            if contact is None:
                raise HTTPException(status_code=404, detail="Contact not found")

        subtotal = Decimal("0")
        tax_amount = Decimal("0")
        items: list[InvoiceItem] = []

        for item in payload.items:
            product = None
            if item.product_id:
                product = (
                    await db.execute(select(Product).where(Product.id == item.product_id).limit(1))
                ).scalar_one_or_none()
            line_base = Decimal(item.quantity) * Decimal(item.unit_price)
            line_tax = line_base * (Decimal(item.tax_percent) / Decimal("100"))
            line_total = line_base + line_tax
            subtotal += line_base
            tax_amount += line_tax
            items.append(
                InvoiceItem(
                    product_id=product.id if product else None,
                    description=item.description,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    tax_percent=item.tax_percent,
                    line_total=line_total,
                )
            )

        total_amount = subtotal + tax_amount - payload.discount_amount
        invoice = Invoice(
            invoice_number=await InvoiceService._next_invoice_number(db, invoice_type),
            invoice_type=invoice_type,
            status=InvoiceStatus.pending,
            contact_id=payload.contact_id,
            invoice_date=payload.invoice_date,
            due_date=payload.due_date,
            subtotal=subtotal,
            tax_amount=tax_amount if payload.gst_enabled else Decimal("0"),
            discount_amount=payload.discount_amount,
            total_amount=total_amount,
            amount_paid=Decimal("0"),
            amount_due=total_amount,
            gst_enabled=payload.gst_enabled,
            notes=payload.notes,
            created_by_id=actor.id,
            items=items,
        )
        db.add(invoice)
        await db.flush()

        for item in invoice.items:
            if not item.product_id:
                continue
            product = (
                await db.execute(select(Product).where(Product.id == item.product_id).limit(1))
            ).scalar_one()
            if invoice_type == InvoiceType.sale:
                product.stock_quantity -= item.quantity
                inventory_action = InventoryAction.sold
            elif invoice_type == InvoiceType.purchase:
                product.stock_quantity += item.quantity
                inventory_action = InventoryAction.purchased
            else:
                product.stock_quantity += item.quantity
                inventory_action = InventoryAction.adjustment
            if product.stock_quantity < 0:
                raise HTTPException(
                    status_code=400, detail=f"Insufficient stock for product {product.name}"
                )
            db.add(
                InventoryLog(
                    product_id=product.id,
                    action=inventory_action,
                    quantity=item.quantity,
                    notes=f"Invoice {invoice.invoice_number}",
                    created_by_id=actor.id,
                )
            )

        await InvoiceService._update_contact_balance(db, invoice, contact)
        db.add(
            Notification(
                title="Invoice created",
                message=f"{invoice.invoice_number} created for Rs. {invoice.total_amount}",
                type="billing",
                user_id=actor.id,
                related_entity_type="invoice",
                related_entity_id=invoice.id,
            )
        )
        await create_audit_log(
            db, user=actor, action="invoice.create", entity_type="invoice", entity_id=invoice.id
        )
        await db.commit()
        await db.refresh(invoice)
        return invoice

    @staticmethod
    async def list_invoices(db: AsyncSession) -> list[Invoice]:
        return (
            await db.execute(
                select(Invoice)
                .options(joinedload(Invoice.contact))
                .order_by(Invoice.invoice_date.desc(), Invoice.created_at.desc())
            )
        ).scalars().all()

    @staticmethod
    async def get_invoice(db: AsyncSession, invoice_id: str) -> Invoice:
        invoice = (
            await db.execute(
                select(Invoice)
                .where(Invoice.id == invoice_id)
                .options(joinedload(Invoice.items), joinedload(Invoice.contact))
                .limit(1)
            )
        ).scalar_one_or_none()
        if invoice is None:
            raise HTTPException(status_code=404, detail="Invoice not found")
        return invoice

    @staticmethod
    def build_reminder(invoice: Invoice) -> dict:
        if not invoice.contact or not invoice.contact.phone:
            raise HTTPException(status_code=400, detail="Contact phone number is missing")
        message = (
            f"Hi {invoice.contact.full_name}, your payment of Rs. {invoice.amount_due} for invoice "
            f"#{invoice.invoice_number} dated {invoice.invoice_date.isoformat()} is pending. "
            "Kindly clear payment soon. Thank you."
        )
        return {"message": message, "whatsappLink": build_whatsapp_link(invoice.contact.phone, message)}

    @staticmethod
    async def _next_invoice_number(db: AsyncSession, invoice_type: InvoiceType) -> str:
        prefix = {
            InvoiceType.sale: "SAL",
            InvoiceType.purchase: "PUR",
            InvoiceType.return_invoice: "RET",
        }[invoice_type]
        today = date.today().strftime("%Y%m%d")
        count_query = select(func.count(Invoice.id)).where(Invoice.invoice_type == invoice_type)
        count = (await db.execute(count_query)).scalar_one()
        return f"{prefix}-{today}-{count + 1:04d}"

    @staticmethod
    async def _update_contact_balance(
        db: AsyncSession, invoice: Invoice, contact: Contact | None
    ) -> None:
        if not contact:
            return

        if invoice.invoice_type == InvoiceType.sale:
            profile = (
                await db.execute(
                    select(ClientProfile).where(ClientProfile.contact_id == contact.id).limit(1)
                )
            ).scalar_one_or_none()
            if profile:
                profile.current_balance += invoice.total_amount
                profile.pending_amount += invoice.amount_due
        elif invoice.invoice_type == InvoiceType.purchase:
            profile = (
                await db.execute(
                    select(SupplierProfile).where(SupplierProfile.contact_id == contact.id).limit(1)
                )
            ).scalar_one_or_none()
            if profile:
                profile.current_balance += invoice.total_amount
                profile.pending_amount += invoice.amount_due

