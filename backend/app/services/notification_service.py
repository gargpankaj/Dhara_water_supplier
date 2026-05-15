from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import Notification


class NotificationService:
    @staticmethod
    async def list_notifications(db: AsyncSession, user_id: str | None = None) -> list[Notification]:
        statement = select(Notification).order_by(Notification.created_at.desc())
        if user_id:
            statement = statement.where(Notification.user_id == user_id)
        return (await db.execute(statement.limit(30))).scalars().all()

    @staticmethod
    async def mark_as_read(db: AsyncSession, notification_id: str) -> Notification | None:
        notification = (
            await db.execute(
                select(Notification).where(Notification.id == notification_id).limit(1)
            )
        ).scalar_one_or_none()
        if notification:
            notification.is_read = True
            await db.commit()
            await db.refresh(notification)
        return notification

