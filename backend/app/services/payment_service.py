from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import (
    ClientProfile,
    Invoice,
    InvoiceStatus,
    Notification,
    Payment,
    PaymentMethod,
    User,
)
from app.schemas.domain import PaymentCreate
from app.utils.audit import create_audit_log


class PaymentService:
    @staticmethod
    async def create_payment(db: AsyncSession, payload: PaymentCreate, actor: User) -> Payment:
        invoice = None
        if payload.invoice_id:
            invoice = (
                await db.execute(select(Invoice).where(Invoice.id == payload.invoice_id).limit(1))
            ).scalar_one_or_none()
            if invoice is None:
                raise HTTPException(status_code=404, detail="Invoice not found")

        payment = Payment(
            invoice_id=payload.invoice_id,
            contact_id=payload.contact_id or (invoice.contact_id if invoice else None),
            amount=payload.amount,
            payment_date=payload.payment_date,
            method=PaymentMethod(payload.method),
            reference_no=payload.reference_no,
            notes=payload.notes,
            created_by_id=actor.id,
        )
        db.add(payment)

        if invoice:
            invoice.amount_paid += payload.amount
            invoice.amount_due -= payload.amount
            if invoice.amount_due <= 0:
                invoice.amount_due = 0
                invoice.status = InvoiceStatus.paid
            else:
                invoice.status = InvoiceStatus.partial

            if invoice.contact_id:
                profile = (
                    await db.execute(
                        select(ClientProfile).where(ClientProfile.contact_id == invoice.contact_id).limit(1)
                    )
                ).scalar_one_or_none()
                if profile:
                    profile.current_balance -= payload.amount
                    profile.pending_amount = max(profile.pending_amount - payload.amount, 0)
                    profile.last_payment_date = payload.payment_date

        db.add(
            Notification(
                title="Payment received",
                message=f"Payment of Rs. {payload.amount} received.",
                type="payment",
                user_id=actor.id,
                related_entity_type="payment",
            )
        )
        await create_audit_log(
            db, user=actor, action="payment.create", entity_type="payment", entity_id=payment.id
        )
        await db.commit()
        await db.refresh(payment)
        return payment

    @staticmethod
    async def list_payments(db: AsyncSession) -> list[Payment]:
        return (
            await db.execute(select(Payment).order_by(Payment.payment_date.desc(), Payment.created_at.desc()))
        ).scalars().all()
