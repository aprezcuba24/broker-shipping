from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order.enums import Currency
from app.models.product.product import Product


async def create_product(
    session: AsyncSession,
    *,
    organization_id: UUID | str,
    name: str | None = None,
    description: str | None = None,
    has_commission: bool | None = None,
    currency: Currency | None = None,
    commission_currency: Currency | None = None,
    commission: int | None = None,
    price: int | None = None,
    stock: int | None = None,
) -> dict:
    oid = (
        organization_id
        if isinstance(organization_id, UUID)
        else UUID(str(organization_id))
    )
    price_currency = currency if currency is not None else Currency.cup
    commission_amount = commission if commission is not None else 0
    entity = Product(
        name=name if name is not None else "Factory product",
        description=description,
        has_commission=(
            has_commission
            if has_commission is not None
            else commission_amount > 0
        ),
        organization_id=oid,
        currency=price_currency,
        commission=commission_amount,
        commission_currency=(
            commission_currency
            if commission_currency is not None
            else price_currency
        ),
        price=price if price is not None else 0,
        stock=stock if stock is not None else 1000,
        reserved=0,
    )
    session.add(entity)
    await session.flush()
    await session.commit()
    return entity.model_dump(mode="json")


class ProductFactory:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._n = 0

    async def build(
        self,
        *,
        organization_id: UUID | str,
        name: str | None = None,
        description: str | None = None,
        has_commission: bool | None = None,
        currency: Currency | None = None,
        commission_currency: Currency | None = None,
        commission: int | None = None,
        price: int | None = None,
        stock: int | None = None,
    ) -> dict:
        self._n += 1
        final_name = name or f"SKU-{self._n:04d}"
        return await create_product(
            self._session,
            organization_id=organization_id,
            name=final_name,
            description=description,
            has_commission=has_commission,
            currency=currency,
            commission_currency=commission_currency,
            commission=commission,
            price=price,
            stock=stock,
        )
