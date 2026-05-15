from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_roles
from app.db.session import get_db
from app.schemas.domain import PriceUpdateRequest, ProductCreate
from app.services.inventory_service import InventoryService

router = APIRouter()


@router.get("")
async def list_products(
    category: str | None = Query(default=None),
    query: str | None = Query(default=None),
    _: object = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await InventoryService.list_products(db, category=category, query=query)


@router.post("")
async def create_product(
    payload: ProductCreate,
    current_user=Depends(require_roles("Owner", "Manager")),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await InventoryService.create_product(db, payload, current_user)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/{product_id}/prices")
async def update_prices(
    product_id: str,
    payload: PriceUpdateRequest,
    current_user=Depends(require_roles("Owner", "Manager")),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await InventoryService.update_prices(db, product_id, payload, current_user)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/{product_id}/price-history")
async def product_price_history(
    product_id: str,
    _: object = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await InventoryService.price_history(db, product_id)

