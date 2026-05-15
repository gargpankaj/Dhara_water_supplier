from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_roles
from app.db.session import get_db
from app.schemas.domain import ContactCreate
from app.services.contact_service import ContactService

router = APIRouter()


@router.get("")
async def list_clients(
    query: str | None = Query(default=None),
    _: object = Depends(require_roles("Owner", "Manager", "Staff", "Accountant")),
    db: AsyncSession = Depends(get_db),
):
    return await ContactService.list_contacts(db, role_filter="client", query=query)


@router.post("")
async def create_client(
    payload: ContactCreate,
    current_user=Depends(require_roles("Owner", "Manager", "Staff")),
    db: AsyncSession = Depends(get_db),
):
    payload.is_client = True
    return await ContactService.create_contact(db, payload, current_user)

