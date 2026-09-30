from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from app.lib.exceptions import raise_api_error
from app.lib.persistence import get_entity
from app.lib.utils import utc_now
from app.models.location.municipality import Municipality
from app.models.location.neighborhood import Neighborhood
from app.models.location.province import Province
from app.models.messaging.provider_messaging_price import ProviderMessagingPrice
from app.schemas.messaging import (
    MessagingPriceCreate,
    MessagingPricePublic,
    MessagingPriceUpdate,
)
from app.schemas.money import Money


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


async def _enrich_prices_with_locations(
    session: AsyncSession,
    prices: list[ProviderMessagingPrice],
) -> None:
    if not prices:
        return
    neighborhood_ids = list({price.neighborhood_id for price in prices})
    neighborhoods_result = await session.execute(
        select(Neighborhood).where(col(Neighborhood.id).in_(neighborhood_ids))
    )
    neighborhoods = {
        neighborhood.id: neighborhood
        for neighborhood in neighborhoods_result.scalars().all()
    }
    municipality_ids = list(
        {neighborhood.municipality_id for neighborhood in neighborhoods.values()}
    )
    municipalities_by_id: dict[UUID, Municipality] = {}
    if municipality_ids:
        municipalities_result = await session.execute(
            select(Municipality).where(col(Municipality.id).in_(municipality_ids))
        )
        municipalities_by_id = {
            municipality.id: municipality
            for municipality in municipalities_result.scalars().all()
        }
    province_ids = list(
        {municipality.province_id for municipality in municipalities_by_id.values()}
    )
    provinces_by_id: dict[UUID, Province] = {}
    if province_ids:
        provinces_result = await session.execute(
            select(Province).where(col(Province.id).in_(province_ids))
        )
        provinces_by_id = {
            province.id: province for province in provinces_result.scalars().all()
        }

    for price in prices:
        neighborhood = neighborhoods.get(price.neighborhood_id)
        municipality = (
            municipalities_by_id.get(neighborhood.municipality_id)
            if neighborhood is not None
            else None
        )
        province = (
            provinces_by_id.get(municipality.province_id)
            if municipality is not None
            else None
        )
        object.__setattr__(
            price,
            "neighborhood_name",
            neighborhood.name if neighborhood is not None else None,
        )
        object.__setattr__(
            price,
            "municipality_id",
            municipality.id if municipality is not None else None,
        )
        object.__setattr__(
            price,
            "municipality_name",
            municipality.name if municipality is not None else None,
        )
        object.__setattr__(
            price,
            "province_id",
            province.id if province is not None else None,
        )
        object.__setattr__(
            price,
            "province_name",
            province.name if province is not None else None,
        )


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
    await _enrich_prices_with_locations(session, prices)
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
    await _enrich_prices_with_locations(session, [price])
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
    await _enrich_prices_with_locations(session, [price])
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
