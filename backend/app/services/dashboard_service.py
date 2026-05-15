from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import EventBooking, Expense, Invoice, InvoiceStatus, InvoiceType, Notification, Product


class DashboardService:
    @staticmethod
    async def overview(db: AsyncSession) -> dict:
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)

        today_revenue = await DashboardService._sum_invoice_amount(
            db, today, today, invoice_type=InvoiceType.sale
        )
        week_revenue = await DashboardService._sum_invoice_amount(
            db, week_start, today, invoice_type=InvoiceType.sale
        )
        month_revenue = await DashboardService._sum_invoice_amount(
            db, month_start, today, invoice_type=InvoiceType.sale
        )
        premium_revenue = await DashboardService._sum_invoice_amount(
            db, month_start, today, invoice_type=InvoiceType.sale, notes_filter="premium"
        )

        expenses_total = await DashboardService._sum_expenses(db, month_start, today)
        inventory_value = await DashboardService._inventory_value(db)
        pending_payments = await DashboardService._pending_amount(db)

        line_chart = await DashboardService._sales_line_chart(db, today)
        distribution = await DashboardService._product_distribution(db)
        low_stock = await DashboardService._low_stock_alerts(db)
        notifications = await DashboardService._recent_notifications(db)
        deliveries = await DashboardService._todays_deliveries(db, today)
        upcoming_events = await DashboardService._upcoming_events(db, today)

        return {
            "kpis": {
                "totalRevenueToday": today_revenue,
                "revenueThisWeek": week_revenue,
                "revenueThisMonth": month_revenue,
                "netProfit": month_revenue - expenses_total,
                "pendingPayments": pending_payments,
                "inventoryValue": inventory_value,
                "premiumOrdersRevenue": premium_revenue,
            },
            "charts": {
                "salesLine": line_chart,
                "weeklyGrowth": line_chart[-7:],
                "productDistribution": distribution,
                "bestSellerHeatmap": line_chart[-12:],
                "monthlyProfit": line_chart,
            },
            "widgets": {
                "lowStockAlerts": low_stock,
                "pendingPaymentsList": notifications["pendingPaymentsList"],
                "todaysDeliveries": deliveries,
                "eventOrdersUpcoming": upcoming_events,
                "notificationCenter": notifications["notificationCenter"],
            },
        }

    @staticmethod
    async def _sum_invoice_amount(
        db: AsyncSession,
        start_date: date,
        end_date: date,
        *,
        invoice_type: InvoiceType,
        notes_filter: str | None = None,
    ) -> Decimal:
        statement = select(func.coalesce(func.sum(Invoice.total_amount), 0)).where(
            Invoice.invoice_type == invoice_type,
            Invoice.invoice_date >= start_date,
            Invoice.invoice_date <= end_date,
        )
        if notes_filter:
            statement = statement.where(Invoice.notes.ilike(f"%{notes_filter}%"))
        return Decimal((await db.execute(statement)).scalar_one())

    @staticmethod
    async def _sum_expenses(db: AsyncSession, start_date: date, end_date: date) -> Decimal:
        statement = select(func.coalesce(func.sum(Expense.amount), 0)).where(
            Expense.expense_date >= start_date,
            Expense.expense_date <= end_date,
        )
        return Decimal((await db.execute(statement)).scalar_one())

    @staticmethod
    async def _inventory_value(db: AsyncSession) -> Decimal:
        result = await db.execute(select(Product.stock_quantity, Product.purchase_cost))
        return sum((Decimal(row.stock_quantity) * Decimal(row.purchase_cost) for row in result), Decimal("0"))

    @staticmethod
    async def _pending_amount(db: AsyncSession) -> Decimal:
        statement = select(func.coalesce(func.sum(Invoice.amount_due), 0)).where(
            Invoice.status.in_([InvoiceStatus.pending, InvoiceStatus.partial, InvoiceStatus.overdue])
        )
        return Decimal((await db.execute(statement)).scalar_one())

    @staticmethod
    async def _sales_line_chart(db: AsyncSession, today: date) -> list[dict]:
        start = today - timedelta(days=29)
        result = await db.execute(
            select(Invoice.invoice_date, func.coalesce(func.sum(Invoice.total_amount), 0))
            .where(Invoice.invoice_date >= start, Invoice.invoice_type == InvoiceType.sale)
            .group_by(Invoice.invoice_date)
            .order_by(Invoice.invoice_date.asc())
        )
        lookup = {row[0]: Decimal(row[1]) for row in result}
        return [
            {"label": day.isoformat(), "sales": lookup.get(day, Decimal("0")), "profit": lookup.get(day, Decimal("0")) * Decimal("0.32")}
            for day in (start + timedelta(days=offset) for offset in range(30))
        ]

    @staticmethod
    async def _product_distribution(db: AsyncSession) -> list[dict]:
        result = await db.execute(
            select(Product.category, func.count(Product.id)).group_by(Product.category)
        )
        return [{"name": row[0].value if hasattr(row[0], "value") else row[0], "value": row[1]} for row in result]

    @staticmethod
    async def _low_stock_alerts(db: AsyncSession) -> list[dict]:
        result = await db.execute(
            select(Product)
            .where(Product.stock_quantity <= Product.low_stock_threshold)
            .order_by(Product.stock_quantity.asc())
        )
        return [
            {
                "id": product.id,
                "name": product.name,
                "sku": product.sku,
                "stock": product.stock_quantity,
                "threshold": product.low_stock_threshold,
            }
            for product in result.scalars().all()
        ]

    @staticmethod
    async def _recent_notifications(db: AsyncSession) -> dict:
        notifications = (
            await db.execute(select(Notification).order_by(Notification.created_at.desc()).limit(6))
        ).scalars().all()
        pending_invoices = (
            await db.execute(
                select(Invoice.invoice_number, Invoice.amount_due)
                .where(Invoice.amount_due > 0)
                .order_by(Invoice.invoice_date.desc())
                .limit(6)
            )
        ).all()
        return {
            "notificationCenter": [
                {
                    "id": item.id,
                    "title": item.title,
                    "message": item.message,
                    "type": item.type,
                    "createdAt": item.created_at,
                }
                for item in notifications
            ],
            "pendingPaymentsList": [
                {"invoiceNumber": row[0], "amountDue": row[1]} for row in pending_invoices
            ],
        }

    @staticmethod
    async def _todays_deliveries(db: AsyncSession, today: date) -> list[dict]:
        invoices = (
            await db.execute(
                select(Invoice.invoice_number, Invoice.total_amount)
                .where(Invoice.invoice_date == today, Invoice.invoice_type == InvoiceType.sale)
                .limit(8)
            )
        ).all()
        return [{"invoiceNumber": row[0], "amount": row[1]} for row in invoices]

    @staticmethod
    async def _upcoming_events(db: AsyncSession, today: date) -> list[dict]:
        rows = (
            await db.execute(
                select(EventBooking)
                .where(EventBooking.event_date >= today)
                .order_by(EventBooking.event_date.asc())
                .limit(6)
            )
        ).scalars().all()
        return [
            {
                "id": event.id,
                "venue": event.venue,
                "eventType": event.event_type.value,
                "eventDate": event.event_date.isoformat(),
                "remainingDue": event.remaining_due,
            }
            for event in rows
        ]
