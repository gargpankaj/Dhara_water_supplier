import asyncio
from sqlalchemy import select
from app.db.session import SessionLocal
from app.models.entities import Product, ProductCategory

async def test_query():
    async with SessionLocal() as session:
        try:
            statement = select(Product)
            result = await session.execute(statement)
            products = result.scalars().all()
            print(f"FOUND {len(products)} products")
        except Exception as e:
            import traceback
            traceback.print_exc()

asyncio.run(test_query())
