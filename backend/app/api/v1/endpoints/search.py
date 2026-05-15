from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.services.search_service import SearchService

router = APIRouter()


@router.get("/global")
async def global_search(
    query: str = Query(..., min_length=2),
    _: object = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await SearchService.global_search(db, query)

