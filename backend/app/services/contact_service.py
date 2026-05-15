from decimal import Decimal

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.entities import ClientProfile, Contact, SupplierProfile, User
from app.schemas.domain import ContactCreate, ContactSummary
from app.utils.audit import create_audit_log


class ContactService:
    @staticmethod
    async def create_contact(db: AsyncSession, payload: ContactCreate, actor: User) -> ContactSummary:
        contact = Contact(
            full_name=payload.full_name,
            phone=payload.phone,
            whatsapp=payload.whatsapp,
            email=payload.email,
            address=payload.address,
            gst_number=payload.gst_number,
            notes=payload.notes,
        )
        db.add(contact)
        await db.flush()

        if payload.is_client:
            db.add(
                ClientProfile(
                    contact_id=contact.id,
                    credit_limit=payload.credit_limit,
                )
            )
        if payload.is_supplier:
            db.add(
                SupplierProfile(
                    contact_id=contact.id,
                    credit_limit=payload.credit_limit,
                )
            )

        await create_audit_log(
            db, user=actor, action="contact.create", entity_type="contact", entity_id=contact.id
        )
        await db.commit()
        return ContactSummary(
            id=contact.id,
            full_name=contact.full_name,
            phone=contact.phone,
            whatsapp=contact.whatsapp,
            address=contact.address,
            gst_number=contact.gst_number,
            is_client=payload.is_client,
            is_supplier=payload.is_supplier,
            current_balance=Decimal("0"),
            pending_amount=Decimal("0"),
            advance_paid=Decimal("0"),
            credit_limit=payload.credit_limit,
        )

    @staticmethod
    async def list_contacts(
        db: AsyncSession,
        *,
        role_filter: str | None = None,
        query: str | None = None,
    ) -> list[ContactSummary]:
        statement = select(Contact).options(
            joinedload(Contact.client_profile), joinedload(Contact.supplier_profile)
        )
        if query:
            like_query = f"%{query.lower()}%"
            statement = statement.where(
                or_(
                    func.lower(Contact.full_name).like(like_query),
                    func.lower(Contact.phone).like(like_query),
                )
            )
        records = (await db.execute(statement.order_by(Contact.created_at.desc()))).scalars().all()
        items: list[ContactSummary] = []
        for record in records:
            is_client = record.client_profile is not None
            is_supplier = record.supplier_profile is not None
            if role_filter == "client" and not is_client:
                continue
            if role_filter == "supplier" and not is_supplier:
                continue

            balance_source = record.client_profile or record.supplier_profile
            items.append(
                ContactSummary(
                    id=record.id,
                    full_name=record.full_name,
                    phone=record.phone,
                    whatsapp=record.whatsapp,
                    address=record.address,
                    gst_number=record.gst_number,
                    is_client=is_client,
                    is_supplier=is_supplier,
                    current_balance=balance_source.current_balance if balance_source else Decimal("0"),
                    pending_amount=balance_source.pending_amount if balance_source else Decimal("0"),
                    advance_paid=balance_source.advance_paid if balance_source else Decimal("0"),
                    credit_limit=balance_source.credit_limit if balance_source else Decimal("0"),
                    last_payment_date=balance_source.last_payment_date if balance_source else None,
                )
            )
        return items

