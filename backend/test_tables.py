import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def test_tables():
    url = "postgresql+asyncpg://postgres:postgres@127.0.0.1:5432/water_supplier_management"
    engine = create_async_engine(url)
    try:
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
            tables = result.fetchall()
            print("TABLES:", [t[0] for t in tables])
    except Exception as e:
        print(f"ERROR: {e}")

asyncio.run(test_tables())
