from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import AuditLog, User


async def create_audit_log(
    db: AsyncSession,
    *,
    user: User | None,
    action: str,
    entity_type: str,
    entity_id: str | None = None,
    metadata_json: str | None = None,
) -> None:
    db.add(
        AuditLog(
            user_id=user.id if user else None,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            metadata_json=metadata_json,
        )
    )

