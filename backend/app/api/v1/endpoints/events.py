from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_roles
from app.db.session import get_db
from app.schemas.domain import EventBookingCreate
from app.services.event_service import EventService

router = APIRouter()


@router.get("")
async def list_event_bookings(
    _: object = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    return await EventService.list_bookings(db)


@router.post("")
async def create_event_booking(
    payload: EventBookingCreate,
    current_user=Depends(require_roles("Owner", "Manager", "Staff")),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await EventService.create_booking(db, payload, current_user)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

