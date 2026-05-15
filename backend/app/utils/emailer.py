from app.core.config import settings


async def send_otp_email(email: str, otp_code: str) -> None:
    # This placeholder keeps delivery settings environment-driven for real SMTP credentials.
    _ = (settings.smtp_host, settings.smtp_port, settings.smtp_username, settings.smtp_password)
    print(f"OTP for {email}: {otp_code}")

