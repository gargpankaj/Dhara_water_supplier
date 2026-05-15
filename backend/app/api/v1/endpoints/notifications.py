from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.services.notification_service import NotificationService

router = APIRouter()


@router.get("")
async def list_notifications(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await NotificationService.list_notifications(db, current_user.id)


@router.patch("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    _: object = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    notification = await NotificationService.mark_as_read(db, notification_id)
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification

