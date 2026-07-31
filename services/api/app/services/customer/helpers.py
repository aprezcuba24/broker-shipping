from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from app.lib.persistence import get_entity
from app.lib.persistence.apply_update import apply_partial_update
from app.models.customer.address import Address
from app.models.customer.customer import Customer
from app.models.location.municipality import Municipality
from app.schemas.customer import AddressCreate


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
    address = Address(
        address=data.address,
        customer_id=customer_id,
        province_id=data.province_id,
        municipality_id=data.municipality_id,
    )
    session.add(address)
    await session.flush()
    return address


async def upsert_customer_address(
    session: AsyncSession,
    *,
    customer_id: UUID,
    data: AddressCreate,
) -> Address:
    addresses = await load_addresses_by_customer_ids(session, [customer_id])
    address = addresses.get(customer_id)
    if address is None:
        return await create_customer_address(
            session,
            customer_id=customer_id,
            data=data,
        )

    await get_entity(
        session,
        Municipality,
        id=data.municipality_id,
        province_id=data.province_id,
    )
    apply_partial_update(address, data)
    session.add(address)
    await session.flush()
    return address


async def load_addresses_by_customer_ids(
    session: AsyncSession,
    customer_ids: list[UUID],
) -> dict[UUID, Address]:
    if not customer_ids:
        return {}
    result = await session.execute(
        select(Address)
        .where(col(Address.customer_id).in_(customer_ids))
        .order_by(Address.created_at, Address.id)
    )
    addresses: dict[UUID, Address] = {}
    for address in result.scalars().all():
        addresses.setdefault(address.customer_id, address)
    return addresses


async def attach_addresses_to_customers(
    session: AsyncSession,
    customers: list[Customer],
) -> None:
    addresses = await load_addresses_by_customer_ids(
        session,
        [customer.id for customer in customers],
    )
    for customer in customers:
        object.__setattr__(customer, "address", addresses.get(customer.id))
