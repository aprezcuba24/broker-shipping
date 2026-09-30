from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from app.lib.exceptions import raise_api_error
from app.lib.persistence import get_entity
from app.lib.utils import utc_now
from app.models.location.neighborhood import Neighborhood
from app.models.messaging.provider_messaging_price import ProviderMessagingPrice
from app.schemas.messaging import (
    MessagingPriceCreate,
    MessagingPricePublic,
    MessagingPriceUpdate,
)
from app.schemas.money import Money
from app.services.location import load_locations


def messaging_price_to_public(price: ProviderMessagingPrice) -> MessagingPricePublic:
    return MessagingPricePublic(
        id=price.id,
        organization_id=price.organization_id,
        neighborhood_id=price.neighborhood_id,
        neighborhood_name=getattr(price, "neighborhood_name", None),
        municipality_id=getattr(price, "municipality_id", None),
        municipality_name=getattr(price, "municipality_name", None),
        province_id=getattr(price, "province_id", None),
        province_name=getattr(price, "province_name", None),
        price=Money(amount=price.amount, currency=price.currency),
        created_at=price.created_at,
        updated_at=price.updated_at,
    )


async def _attach_location_names(
    session: AsyncSession,
    prices: list[ProviderMessagingPrice],
) -> None:
    if not prices:
        return
    lookup = await load_locations(
        session,
        neighborhood_ids=[price.neighborhood_id for price in prices],
    )
    for price in prices:
        chain = lookup.for_neighborhood(price.neighborhood_id)
        object.__setattr__(price, "neighborhood_name", chain.neighborhood_name)
        object.__setattr__(price, "municipality_id", chain.municipality_id)
        object.__setattr__(price, "municipality_name", chain.municipality_name)
        object.__setattr__(price, "province_id", chain.province_id)
        object.__setattr__(price, "province_name", chain.province_name)


async def list_messaging_prices(
    session: AsyncSession,
    organization_id: UUID,
) -> list[ProviderMessagingPrice]:
    result = await session.execute(
        select(ProviderMessagingPrice)
        .where(ProviderMessagingPrice.organization_id == organization_id)
        .order_by(ProviderMessagingPrice.created_at, ProviderMessagingPrice.id)
    )
    prices = list(result.scalars().all())
    await _attach_location_names(session, prices)
    return prices


async def create_messaging_price(
    session: AsyncSession,
    organization_id: UUID,
    data: MessagingPriceCreate,
) -> ProviderMessagingPrice:
    await get_entity(session, Neighborhood, id=data.neighborhood_id)
    existing = await get_entity(
        session,
        ProviderMessagingPrice,
        required=False,
        organization_id=organization_id,
        neighborhood_id=data.neighborhood_id,
    )
    if existing is not None:
        raise_api_error("messaging_price_neighborhood_conflict")

    price = ProviderMessagingPrice(
        organization_id=organization_id,
        neighborhood_id=data.neighborhood_id,
        amount=data.price.amount,
        currency=data.price.currency,
    )
    session.add(price)
    await session.commit()
    await session.refresh(price)
    await _attach_location_names(session, [price])
    return price


async def update_messaging_price(
    session: AsyncSession,
    price_id: UUID,
    organization_id: UUID,
    data: MessagingPriceUpdate,
) -> ProviderMessagingPrice:
    price = await get_entity(
        session,
        ProviderMessagingPrice,
        id=price_id,
        organization_id=organization_id,
    )
    if data.price is not None:
        price.amount = data.price.amount
        price.currency = data.price.currency
        price.updated_at = utc_now()
    session.add(price)
    await session.commit()
    await session.refresh(price)
    await _attach_location_names(session, [price])
    return price


async def delete_messaging_price(
    session: AsyncSession,
    price_id: UUID,
    organization_id: UUID,
) -> None:
    price = await get_entity(
        session,
        ProviderMessagingPrice,
        id=price_id,
        organization_id=organization_id,
    )
    await session.delete(price)
    await session.commit()


async def load_prices_by_provider_and_neighborhood(
    session: AsyncSession,
    provider_ids: list[UUID],
    neighborhood_id: UUID | None,
) -> dict[UUID, ProviderMessagingPrice]:
    if not provider_ids or neighborhood_id is None:
        return {}
    result = await session.execute(
        select(ProviderMessagingPrice).where(
            col(ProviderMessagingPrice.organization_id).in_(provider_ids),
            ProviderMessagingPrice.neighborhood_id == neighborhood_id,
        )
    )
    return {price.organization_id: price for price in result.scalars().all()}
