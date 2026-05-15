from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_roles
from app.db.session import get_db
from app.schemas.common import MessageResponse
from app.schemas.domain import InventoryMovementCreate
from app.services.inventory_service import InventoryService

router = APIRouter()


@router.get("/products")
async def inventory_products(
    category: str | None = Query(default=None),
    query: str | None = Query(default=None),
    _: object = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await InventoryService.list_products(db, category=category, query=query)


@router.post("/movements", response_model=MessageResponse)
async def create_inventory_movement(
    payload: InventoryMovementCreate,
    current_user=Depends(require_roles("Owner", "Manager", "Staff")),
    db: AsyncSession = Depends(get_db),
):
    try:
        movement = await InventoryService.move_stock(db, payload, current_user)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return MessageResponse(message=f"Inventory movement {movement.id} recorded successfully.")

