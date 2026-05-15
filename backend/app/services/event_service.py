from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import Contact, EventBooking, EventType, Notification, User
from app.schemas.domain import EventBookingCreate
from app.utils.audit import create_audit_log


class EventService:
    @staticmethod
    async def create_booking(
        db: AsyncSession, payload: EventBookingCreate, actor: User
    ) -> EventBooking:
        client = (
            await db.execute(select(Contact).where(Contact.id == payload.client_contact_id).limit(1))
        ).scalar_one_or_none()
        if client is None:
            raise ValueError("Client not found")

        total_amount = Decimal(payload.quantity) * Decimal(payload.unit_price)
        booking = EventBooking(
            client_contact_id=payload.client_contact_id,
            event_type=EventType(payload.event_type),
            event_date=payload.event_date,
            venue=payload.venue,
            quantity=payload.quantity,
            delivery_time=payload.delivery_time,
            special_notes=payload.special_notes,
            advance_payment=payload.advance_payment,
            remaining_due=total_amount - payload.advance_payment,
            payment_schedule=payload.payment_schedule,
            unit_price=payload.unit_price,
            total_amount=total_amount,
            created_by_id=actor.id,
        )
        db.add(booking)
        db.add(
            Notification(
                title="Premium event booked",
                message=f"{client.full_name} booked {payload.quantity} premium bottles.",
                type="event",
                user_id=actor.id,
                related_entity_type="event_booking",
            )
        )
        await create_audit_log(
            db, user=actor, action="event.create", entity_type="event_booking", entity_id=booking.id
        )
        await db.commit()
        await db.refresh(booking)
        return booking

    @staticmethod
    async def list_bookings(db: AsyncSession) -> list[EventBooking]:
        return (
            await db.execute(select(EventBooking).order_by(EventBooking.event_date.asc()))
        ).scalars().all()

