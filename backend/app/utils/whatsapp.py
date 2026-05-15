from urllib.parse import quote

from app.core.config import settings


def build_whatsapp_link(phone: str, message: str) -> str:
    sanitized_phone = "".join(char for char in phone if char.isdigit())
    return f"{settings.whatsapp_base_url}/{sanitized_phone}?text={quote(message)}"

