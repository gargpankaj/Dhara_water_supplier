from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_roles
from app.db.session import get_db
from app.schemas.domain import ExpenseCreate
from app.services.report_service import ReportService

router = APIRouter()


@router.get("/financial")
async def financial_reports(
    start_date: date = Query(...),
    end_date: date = Query(...),
    _: object = Depends(require_roles("Owner", "Manager", "Accountant")),
    db: AsyncSession = Depends(get_db),
):
    return await ReportService.get_financial_reports(db, start_date, end_date)


@router.get("/expenses")
async def list_expenses(
    _: object = Depends(require_roles("Owner", "Manager", "Accountant")),
    db: AsyncSession = Depends(get_db),
):
    return await ReportService.list_expenses(db)


@router.post("/expenses")
async def create_expense(
    payload: ExpenseCreate,
    current_user=Depends(require_roles("Owner", "Manager", "Accountant")),
    db: AsyncSession = Depends(get_db),
):
    return await ReportService.create_expense(db, payload, current_user)
