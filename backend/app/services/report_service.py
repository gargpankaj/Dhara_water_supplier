from datetime import date
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import Expense, Invoice, InvoiceType, Payment, User
from app.schemas.domain import ExpenseCreate
from app.utils.audit import create_audit_log


class ReportService:
    @staticmethod
    async def create_expense(db: AsyncSession, payload: ExpenseCreate, actor: User) -> Expense:
        expense = Expense(
            category=payload.category,
            description=payload.description,
            amount=payload.amount,
            expense_date=payload.expense_date,
            vendor_name=payload.vendor_name,
            created_by_id=actor.id,
        )
        db.add(expense)
        await create_audit_log(
            db, user=actor, action="expense.create", entity_type="expense", entity_id=expense.id
        )
        await db.commit()
        await db.refresh(expense)
        return expense

    @staticmethod
    async def list_expenses(db: AsyncSession) -> list[Expense]:
        return (
            await db.execute(select(Expense).order_by(Expense.expense_date.desc(), Expense.created_at.desc()))
        ).scalars().all()

    @staticmethod
    async def get_financial_reports(db: AsyncSession, start_date: date, end_date: date) -> dict:
        sales = await ReportService._sum_invoice_type(db, start_date, end_date, InvoiceType.sale)
        purchases = await ReportService._sum_invoice_type(
            db, start_date, end_date, InvoiceType.purchase
        )
        returns = await ReportService._sum_invoice_type(
            db, start_date, end_date, InvoiceType.return_invoice
        )
        expenses = await ReportService._sum_expenses(db, start_date, end_date)
        payments = await ReportService._sum_payments(db, start_date, end_date)
        expense_breakdown = await ReportService._expense_breakdown(db, start_date, end_date)

        return {
            "summary": {
                "sales": sales,
                "premiumEvents": Decimal("0"),
                "miscRevenue": Decimal("0"),
                "purchases": purchases,
                "returns": returns,
                "expenses": expenses,
                "cashFlow": payments - expenses,
                "netProfit": sales - expenses,
            },
            "expenseBreakdown": expense_breakdown,
            "balanceSheetLite": {
                "assets": {"cashAndBank": payments, "receivables": sales - payments},
                "liabilities": {"supplierDues": purchases, "taxPayable": Decimal("0")},
                "equity": {"retainedEarnings": sales - expenses},
            },
        }

    @staticmethod
    async def _sum_invoice_type(
        db: AsyncSession, start_date: date, end_date: date, invoice_type: InvoiceType
    ) -> Decimal:
        statement = select(func.coalesce(func.sum(Invoice.total_amount), 0)).where(
            Invoice.invoice_date >= start_date,
            Invoice.invoice_date <= end_date,
            Invoice.invoice_type == invoice_type,
        )
        return Decimal((await db.execute(statement)).scalar_one())

    @staticmethod
    async def _sum_expenses(db: AsyncSession, start_date: date, end_date: date) -> Decimal:
        statement = select(func.coalesce(func.sum(Expense.amount), 0)).where(
            Expense.expense_date >= start_date, Expense.expense_date <= end_date
        )
        return Decimal((await db.execute(statement)).scalar_one())

    @staticmethod
    async def _sum_payments(db: AsyncSession, start_date: date, end_date: date) -> Decimal:
        statement = select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.payment_date >= start_date, Payment.payment_date <= end_date
        )
        return Decimal((await db.execute(statement)).scalar_one())

    @staticmethod
    async def _expense_breakdown(db: AsyncSession, start_date: date, end_date: date) -> list[dict]:
        result = await db.execute(
            select(Expense.category, func.coalesce(func.sum(Expense.amount), 0))
            .where(Expense.expense_date >= start_date, Expense.expense_date <= end_date)
            .group_by(Expense.category)
        )
        return [{"category": row[0], "amount": row[1]} for row in result]
