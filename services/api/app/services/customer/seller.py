from __future__ import annotations

from uuid import UUID

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from app.lib.persistence import get_entity
from app.lib.persistence.apply_update import apply_partial_update
from app.lib.persistence.pagination import paginate
from app.models.customer.address import Address
from app.models.customer.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate
from app.schemas.pagination import PageResult, PaginationParams
from app.services.customer.helpers import (
    attach_addresses_to_customers,
    create_customer_address,
    upsert_customer_address,
)


async def list_customers_for_seller(
    session: AsyncSession,
    seller_organization_id: UUID,
    *,
    pagination: PaginationParams,
    name: str | None = None,
    ci: str | None = None,
    phone: str | None = None,
) -> PageResult[Customer]:
    stmt = select(Customer).where(
        Customer.seller_organization_id == seller_organization_id
    )
    if name:
        stmt = stmt.where(col(Customer.name).ilike(f"%{name}%"))
    if ci:
        stmt = stmt.where(Customer.ci == ci)
    if phone:
        stmt = stmt.where(col(Customer.phone).ilike(f"%{phone}%"))
    stmt = stmt.order_by(Customer.name, Customer.id)
    result = await paginate(session, stmt, pagination)
    await attach_addresses_to_customers(session, result.items)
    return result


async def get_customer_for_seller(
    session: AsyncSession,
    customer_id: UUID,
    seller_organization_id: UUID,
) -> Customer:
    customer = await get_entity(
        session,
        Customer,
        id=customer_id,
        seller_organization_id=seller_organization_id,
    )
    await attach_addresses_to_customers(session, [customer])
    return customer


async def create_customer(
    session: AsyncSession,
    seller_organization_id: UUID,
    data: CustomerCreate,
) -> Customer:
    customer = Customer(
        name=data.name,
        ci=data.ci,
        phone=data.phone,
        seller_organization_id=seller_organization_id,
    )
    session.add(customer)
    await session.flush()

    address = await create_customer_address(
        session,
        customer_id=customer.id,
        data=data.address,
    )
    await session.commit()
    await session.refresh(customer)
    await session.refresh(address)
    object.__setattr__(customer, "address", address)
    return customer


async def update_customer(
    session: AsyncSession,
    customer_id: UUID,
    seller_organization_id: UUID,
    data: CustomerUpdate,
) -> Customer:
    customer = await get_entity(
        session,
        Customer,
        id=customer_id,
        seller_organization_id=seller_organization_id,
    )

    apply_partial_update(customer, data, exclude={"address"})
    session.add(customer)

    if data.address is not None:
        await upsert_customer_address(
            session,
            customer_id=customer.id,
            data=data.address,
        )

    await session.commit()
    await session.refresh(customer)
    await attach_addresses_to_customers(session, [customer])
    return customer


async def delete_customer(
    session: AsyncSession,
    customer_id: UUID,
    seller_organization_id: UUID,
) -> None:
    customer = await get_entity(
        session,
        Customer,
        id=customer_id,
        seller_organization_id=seller_organization_id,
    )
    await session.execute(delete(Address).where(Address.customer_id == customer.id))
    await session.delete(customer)
    await session.commit()
