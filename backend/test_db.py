import asyncio
from sqlalchemy.ext.asyncio import create_async_engine

async def test_conn():
    url = "postgresql+asyncpg://postgres:postgres@127.0.0.1:5432/water_supplier_management"
    engine = create_async_engine(url)
    try:
        async with engine.begin() as conn:
            print("CONNECTION_SUCCESS")
    except Exception as e:
        print(f"CONNECTION_ERROR: {e}")

asyncio.run(test_conn())
