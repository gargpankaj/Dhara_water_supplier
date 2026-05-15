from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import Contact, Invoice, Payment, Product


class SearchService:
    @staticmethod
    async def global_search(db: AsyncSession, query: str) -> dict:
        like_query = f"%{query}%"
        contacts = (
            await db.execute(
                select(Contact).where(
                    or_(Contact.full_name.ilike(like_query), Contact.phone.ilike(like_query))
                )
            )
        ).scalars().all()
        products = (
            await db.execute(
                select(Product).where(
                    or_(Product.name.ilike(like_query), Product.sku.ilike(like_query))
                )
            )
        ).scalars().all()
        invoices = (
            await db.execute(select(Invoice).where(Invoice.invoice_number.ilike(like_query)))
        ).scalars().all()
        payments = (
            await db.execute(select(Payment).where(Payment.reference_no.ilike(like_query)))
        ).scalars().all()
        return {
            "contacts": [{"id": item.id, "name": item.full_name, "phone": item.phone} for item in contacts],
            "products": [{"id": item.id, "name": item.name, "sku": item.sku} for item in products],
            "invoices": [
                {"id": item.id, "invoiceNumber": item.invoice_number, "amountDue": item.amount_due}
                for item in invoices
            ],
            "payments": [
                {"id": item.id, "amount": item.amount, "referenceNo": item.reference_no}
                for item in payments
            ],
        }

