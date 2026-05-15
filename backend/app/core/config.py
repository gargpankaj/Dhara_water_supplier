from functools import lru_cache

from pydantic import EmailStr, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Water Supplier Management"
    environment: str = "development"
    api_prefix: str = "/api/v1"
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 60 * 12
    database_url: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/water_supplier_management"
    )
    frontend_url: str = "http://localhost:5173"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])
    create_tables_on_startup: bool = False
    rate_limit_per_minute: int = 120
    mail_from: EmailStr = "noreply@example.com"
    smtp_host: str = "smtp.example.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    whatsapp_base_url: str = "https://wa.me"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

