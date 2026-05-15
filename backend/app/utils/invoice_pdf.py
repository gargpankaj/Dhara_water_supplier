from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

from app.models.entities import Invoice


def build_invoice_pdf(invoice: Invoice) -> bytes:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    pdf.setTitle(invoice.invoice_number)
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(20 * mm, 280 * mm, "Water Supplier Invoice")
    pdf.setFont("Helvetica", 10)
    pdf.drawString(20 * mm, 270 * mm, f"Invoice No: {invoice.invoice_number}")
    pdf.drawString(20 * mm, 264 * mm, f"Type: {invoice.invoice_type.value}")
    pdf.drawString(20 * mm, 258 * mm, f"Date: {invoice.invoice_date.isoformat()}")
    y = 245
    for item in invoice.items:
        pdf.drawString(20 * mm, y * mm, f"{item.description} x {item.quantity}")
        pdf.drawRightString(190 * mm, y * mm, f"Rs. {item.line_total}")
        y -= 6
        if y < 40:
            pdf.showPage()
            y = 260
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawRightString(190 * mm, 25 * mm, f"Total: Rs. {invoice.total_amount}")
    pdf.save()
    return buffer.getvalue()

