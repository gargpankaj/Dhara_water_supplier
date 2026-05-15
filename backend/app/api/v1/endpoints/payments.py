from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_roles
from app.db.session import get_db
from app.schemas.domain import PaymentCreate
from app.services.payment_service import PaymentService

router = APIRouter()


@router.get("")
async def list_payments(
    _: object = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    return await PaymentService.list_payments(db)


@router.post("")
async def create_payment(
    payload: PaymentCreate,
    current_user=Depends(require_roles("Owner", "Manager", "Accountant")),
    db: AsyncSession = Depends(get_db),
):
    return await PaymentService.create_payment(db, payload, current_user)

