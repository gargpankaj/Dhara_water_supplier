from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_roles
from app.db.session import get_db
from app.schemas.domain import InvoiceCreate
from app.services.invoice_service import InvoiceService
from app.utils.invoice_pdf import build_invoice_pdf

router = APIRouter()


@router.get("")
async def list_invoices(
    _: object = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    return await InvoiceService.list_invoices(db)


@router.post("")
async def create_invoice(
    payload: InvoiceCreate,
    current_user=Depends(require_roles("Owner", "Manager", "Staff", "Accountant")),
    db: AsyncSession = Depends(get_db),
):
    return await InvoiceService.create_invoice(db, payload, current_user)


@router.get("/{invoice_id}")
async def get_invoice(
    invoice_id: str, _: object = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    return await InvoiceService.get_invoice(db, invoice_id)


@router.get("/{invoice_id}/pdf")
async def download_invoice_pdf(
    invoice_id: str, _: object = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    invoice = await InvoiceService.get_invoice(db, invoice_id)
    pdf = build_invoice_pdf(invoice)
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{invoice.invoice_number}.pdf"'},
    )


@router.get("/{invoice_id}/reminder")
async def invoice_reminder(
    invoice_id: str, _: object = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    invoice = await InvoiceService.get_invoice(db, invoice_id)
    return InvoiceService.build_reminder(invoice)

