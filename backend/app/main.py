from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.middleware import RateLimitMiddleware, SecurityHeadersMiddleware
from app.db.session import create_tables_on_startup


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.create_tables_on_startup:
        await create_tables_on_startup()
    yield


app = FastAPI(
    title="Water Supplier Management API",
    version="1.0.0",
    description="API for water inventory, CRM, billing, accounting, and events.",
    lifespan=lifespan,
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware, max_requests=settings.rate_limit_per_minute)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix=settings.api_prefix)



@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(_, exc: SQLAlchemyError):
    import traceback
    traceback.print_exc()
    return JSONResponse(

        status_code=503,
        content={
            "detail": "Database connection failed. Check DATABASE_URL and make sure PostgreSQL/Supabase is reachable.",
            "error": exc.__class__.__name__,
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error.", "error": exc.__class__.__name__},
    )


@app.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
