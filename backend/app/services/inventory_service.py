from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import (
    InventoryAction,
    InventoryLog,
    Notification,
    Product,
    ProductCategory,
    User,
)
from app.schemas.domain import InventoryMovementCreate, PriceUpdateRequest, ProductCreate
from app.utils.audit import create_audit_log


class InventoryService:
    @staticmethod
    async def create_product(db: AsyncSession, payload: ProductCreate, actor: User) -> Product:
        product = Product(
            sku=payload.sku,
            name=payload.name,
            category=ProductCategory(payload.category),
            unit=payload.unit,
            description=payload.description,
            barcode=payload.barcode,
            low_stock_threshold=payload.low_stock_threshold,
            stock_quantity=payload.stock_quantity,
            purchase_cost=payload.purchase_cost,
            wholesale_price=payload.wholesale_price,
            retail_price=payload.retail_price,
            distributor_price=payload.distributor_price,
            premium_event_price=payload.premium_event_price,
        )
        db.add(product)
        await create_audit_log(
            db, user=actor, action="product.create", entity_type="product", entity_id=product.id
        )
        await db.commit()
        await db.refresh(product)
        return product

    @staticmethod
    async def list_products(
        db: AsyncSession, category: str | None = None, query: str | None = None
    ) -> list[Product]:
        statement = select(Product).order_by(Product.name.asc())
        if category:
            statement = statement.where(Product.category == ProductCategory(category))
        if query:
            statement = statement.where(Product.name.ilike(f"%{query}%"))
        return (await db.execute(statement)).scalars().all()

    @staticmethod
    async def move_stock(
        db: AsyncSession, payload: InventoryMovementCreate, actor: User
    ) -> InventoryLog:
        product = (
            await db.execute(select(Product).where(Product.id == payload.product_id).limit(1))
        ).scalar_one_or_none()
        if product is None:
            raise ValueError("Product not found")

        action = InventoryAction(payload.action)
        adjustment = payload.quantity
        if action in {InventoryAction.remove, InventoryAction.damaged, InventoryAction.sold}:
            adjustment = -payload.quantity

        product.stock_quantity += adjustment
        if product.stock_quantity < 0:
            raise ValueError("Insufficient stock for this movement")

        movement = InventoryLog(
            product_id=payload.product_id,
            action=action,
            quantity=payload.quantity,
            batch_number=payload.batch_number,
            unit_cost=payload.unit_cost,
            notes=payload.notes,
            created_by_id=actor.id,
        )
        db.add(movement)
        if product.stock_quantity <= product.low_stock_threshold:
            db.add(
                Notification(
                    title="Low stock alert",
                    message=f"{product.name} is down to {product.stock_quantity} units.",
                    type="inventory",
                    user_id=actor.id,
                    related_entity_type="product",
                    related_entity_id=product.id,
                )
            )
        await create_audit_log(
            db, user=actor, action="inventory.move", entity_type="inventory_log", entity_id=movement.id
        )
        await db.commit()
        await db.refresh(movement)
        return movement

    @staticmethod
    async def price_history(db: AsyncSession, product_id: str):
        from app.models.entities import PriceHistory

        result = await db.execute(
            select(PriceHistory)
            .where(PriceHistory.product_id == product_id)
            .order_by(desc(PriceHistory.effective_date))
        )
        return result.scalars().all()

    @staticmethod
    async def update_prices(
        db: AsyncSession, product_id: str, payload: PriceUpdateRequest, actor: User
    ) -> Product:
        from app.models.entities import PriceHistory

        product = (
            await db.execute(select(Product).where(Product.id == product_id).limit(1))
        ).scalar_one_or_none()
        if product is None:
            raise ValueError("Product not found")

        fields = [
            "wholesale_price",
            "retail_price",
            "distributor_price",
            "premium_event_price",
            "purchase_cost",
        ]
        for field_name in fields:
            new_value = getattr(payload, field_name)
            if new_value is None:
                continue
            old_value = getattr(product, field_name)
            if old_value != new_value:
                db.add(
                    PriceHistory(
                        product_id=product.id,
                        price_type=field_name,
                        old_price=old_value,
                        new_price=new_value,
                        effective_date=payload.effective_date,
                        changed_by_id=actor.id,
                    )
                )
                setattr(product, field_name, new_value)

        await create_audit_log(
            db, user=actor, action="product.update-prices", entity_type="product", entity_id=product.id
        )
        await db.commit()
        await db.refresh(product)
        return product

