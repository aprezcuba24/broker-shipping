from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from app.lib.persistence import get_entity
from app.models.customer.address import Address
from app.models.customer.customer import Customer
from app.models.location.municipality import Municipality
from app.models.location.neighborhood import Neighborhood
from app.schemas.customer import AddressCreate
from app.services.location import load_locations


async def create_customer_address(
    session: AsyncSession,
    *,
    customer_id: UUID,
    data: AddressCreate,
) -> Address:
    await get_entity(
        session,
        Municipality,
        id=data.municipality_id,
        province_id=data.province_id,
    )
    await get_entity(
        session,
        Neighborhood,
        id=data.neighborhood_id,
        municipality_id=data.municipality_id,
    )
    address = Address(
        address=data.address,
        customer_id=customer_id,
        province_id=data.province_id,
        municipality_id=data.municipality_id,
        neighborhood_id=data.neighborhood_id,
    )
    session.add(address)
    await session.flush()
    return address


def _address_matches(address: Address, data: AddressCreate) -> bool:
    return (
        address.address == data.address
        and address.province_id == data.province_id
        and address.municipality_id == data.municipality_id
        and address.neighborhood_id == data.neighborhood_id
    )


async def upsert_customer_address(
    session: AsyncSession,
    *,
    customer_id: UUID,
    data: AddressCreate,
) -> Address:
    """Keep address history: insert a new row when the location changes."""
    latest_by_customer = await load_addresses_by_customer_ids(session, [customer_id])
    latest = latest_by_customer.get(customer_id)
    if latest is None:
        return await create_customer_address(
            session,
            customer_id=customer_id,
            data=data,
        )
    if _address_matches(latest, data):
        return latest
    return await create_customer_address(
        session,
        customer_id=customer_id,
        data=data,
    )


async def load_addresses_by_customer_ids(
    session: AsyncSession,
    customer_ids: list[UUID],
) -> dict[UUID, Address]:
    """Return the latest address per customer (by created_at, then id)."""
    if not customer_ids:
        return {}
    result = await session.execute(
        select(Address)
        .where(col(Address.customer_id).in_(customer_ids))
        .order_by(Address.created_at, Address.id)
    )
    addresses: dict[UUID, Address] = {}
    for address in result.scalars().all():
        addresses[address.customer_id] = address
    return addresses


async def load_all_addresses_for_customer(
    session: AsyncSession,
    customer_id: UUID,
) -> list[Address]:
    result = await session.execute(
        select(Address)
        .where(Address.customer_id == customer_id)
        .order_by(Address.created_at.desc(), Address.id.desc())
    )
    return list(result.scalars().all())


async def enrich_addresses_with_location_names(
    session: AsyncSession,
    addresses: list[Address],
) -> None:
    if not addresses:
        return
    lookup = await load_locations(
        session,
        province_ids=[address.province_id for address in addresses],
        municipality_ids=[address.municipality_id for address in addresses],
        neighborhood_ids=[
            address.neighborhood_id
            for address in addresses
            if address.neighborhood_id is not None
        ],
    )
    for address in addresses:
        chain = lookup.for_ids(
            province_id=address.province_id,
            municipality_id=address.municipality_id,
            neighborhood_id=address.neighborhood_id,
        )
        object.__setattr__(address, "province_name", chain.province_name)
        object.__setattr__(address, "municipality_name", chain.municipality_name)
        object.__setattr__(address, "neighborhood_name", chain.neighborhood_name)


async def attach_addresses_to_customers(
    session: AsyncSession,
    customers: list[Customer],
) -> None:
    addresses = await load_addresses_by_customer_ids(
        session,
        [customer.id for customer in customers],
    )
    latest_list = list(addresses.values())
    await enrich_addresses_with_location_names(session, latest_list)
    for customer in customers:
        latest = addresses.get(customer.id)
        object.__setattr__(customer, "address", latest)
        object.__setattr__(customer, "addresses", [])


async def attach_address_history_to_customer(
    session: AsyncSession,
    customer: Customer,
) -> None:
    history = await load_all_addresses_for_customer(session, customer.id)
    await enrich_addresses_with_location_names(session, history)
    latest = history[0] if history else None
    object.__setattr__(customer, "address", latest)
    object.__setattr__(customer, "addresses", history)
