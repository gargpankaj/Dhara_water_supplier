from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get("/overview")
async def dashboard_overview(
    _: object = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    return await DashboardService.overview(db)

