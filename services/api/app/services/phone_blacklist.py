from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from app.lib.exceptions import raise_api_error
from app.lib.normalize import normalize_phone
from app.lib.persistence.pagination import paginate
from app.lib.utils import utc_now
from app.models.customer.customer import Customer
from app.models.customer.enums import PhoneBlacklistReason
from app.models.customer.phone_blacklist import PhoneBlacklist
from app.models.organization.enums import OrganizationType
from app.models.organization.organization import Organization
from app.schemas.pagination import PageResult, PaginationParams
from app.schemas.phone_blacklist import (
    PhoneBlacklistCreate,
    PhoneBlacklistCustomerSummary,
    PhoneBlacklistListItem,
    PhoneBlacklistStatusPublic,
)
from app.services import provider_seller_link as link_service
from app.types import PhoneBlacklistStatus


async def get_active_entry(
    session: AsyncSession,
    *,
    organization_id: UUID,
    phone: str,
) -> PhoneBlacklist | None:
    result = await session.execute(
        select(PhoneBlacklist).where(
            PhoneBlacklist.organization_id == organization_id,
            PhoneBlacklist.phone == phone,
            PhoneBlacklist.withdrawn_at.is_(None),
        )
    )
    return result.scalar_one_or_none()


async def get_status_for_phone(
    session: AsyncSession,
    *,
    organization_id: UUID,
    phone: str,
) -> PhoneBlacklistStatusPublic:
    normalized = normalize_phone(phone)
    if not normalized:
        raise_api_error("validation_error")

    own = await get_active_entry(
        session,
        organization_id=organization_id,
        phone=normalized,
    )
    other_count = int(
        await session.scalar(
            select(func.count())
            .select_from(PhoneBlacklist)
            .where(
                PhoneBlacklist.phone == normalized,
                PhoneBlacklist.withdrawn_at.is_(None),
                PhoneBlacklist.organization_id != organization_id,
            )
        )
        or 0
    )

    status: PhoneBlacklistStatus
    if own is not None:
        status = "yes"
    elif other_count > 0:
        status = "reported"
    else:
        status = "no"

    return PhoneBlacklistStatusPublic(
        phone=normalized,
        status=status,
        own_entry_id=own.id if own is not None else None,
        other_count=other_count,
    )


async def _other_counts_by_phone(
    session: AsyncSession,
    *,
    organization_id: UUID,
    phones: list[str],
) -> dict[str, int]:
    if not phones:
        return {}
    result = await session.execute(
        select(PhoneBlacklist.phone, func.count())
        .where(
            PhoneBlacklist.phone.in_(phones),
            PhoneBlacklist.withdrawn_at.is_(None),
            PhoneBlacklist.organization_id != organization_id,
        )
        .group_by(PhoneBlacklist.phone)
    )
    return {phone: int(count) for phone, count in result.all()}


async def _customers_by_phone_for_org(
    session: AsyncSession,
    organization: Organization,
    phones: list[str],
) -> dict[str, Customer]:
    if not phones:
        return {}

    if organization.type == OrganizationType.seller:
        seller_ids = [organization.id]
    else:
        sellers = await link_service.list_linked_sellers(session, organization.id)
        seller_ids = [seller.id for seller in sellers]
        if not seller_ids:
            return {}

    result = await session.execute(
        select(Customer).where(
            Customer.seller_organization_id.in_(seller_ids),
            Customer.phone.in_(phones),
        )
    )
    customers = list(result.scalars().all())
    by_phone: dict[str, Customer] = {}
    for customer in customers:
        # Prefer the first match per phone (stable enough for display).
        by_phone.setdefault(customer.phone, customer)
    return by_phone


async def list_active_for_organization(
    session: AsyncSession,
    organization: Organization,
    *,
    pagination: PaginationParams,
    phone: str | None = None,
    reason: PhoneBlacklistReason | None = None,
) -> PageResult[PhoneBlacklistListItem]:
    stmt = select(PhoneBlacklist).where(
        PhoneBlacklist.organization_id == organization.id,
        PhoneBlacklist.withdrawn_at.is_(None),
    )
    if phone:
        normalized = normalize_phone(phone)
        if normalized:
            stmt = stmt.where(PhoneBlacklist.phone == normalized)
    if reason is not None:
        stmt = stmt.where(PhoneBlacklist.reason == reason)
    stmt = stmt.order_by(col(PhoneBlacklist.created_at).desc(), PhoneBlacklist.id)

    page = await paginate(session, stmt, pagination)
    phones = [entry.phone for entry in page.items]
    other_counts = await _other_counts_by_phone(
        session,
        organization_id=organization.id,
        phones=phones,
    )
    customers = await _customers_by_phone_for_org(session, organization, phones)

    items: list[PhoneBlacklistListItem] = []
    for entry in page.items:
        customer = customers.get(entry.phone)
        items.append(
            PhoneBlacklistListItem(
                id=entry.id,
                phone=entry.phone,
                organization_id=entry.organization_id,
                reason=entry.reason,
                note=entry.note,
                created_at=entry.created_at,
                other_count=other_counts.get(entry.phone, 0),
                customer=(
                    PhoneBlacklistCustomerSummary(
                        id=customer.id,
                        name=customer.name,
                        ci=customer.ci,
                    )
                    if customer is not None
                    else None
                ),
            )
        )
    return PageResult(items=items, total=page.total)


async def add_to_blacklist(
    session: AsyncSession,
    *,
    organization_id: UUID,
    user_id: UUID,
    data: PhoneBlacklistCreate,
) -> PhoneBlacklist:
    existing = await get_active_entry(
        session,
        organization_id=organization_id,
        phone=data.phone,
    )
    if existing is not None:
        raise_api_error("conflict")

    entry = PhoneBlacklist(
        phone=data.phone,
        organization_id=organization_id,
        created_by_user_id=user_id,
        reason=data.reason,
        note=data.note,
    )
    session.add(entry)
    await session.commit()
    await session.refresh(entry)
    return entry


async def withdraw_own_entry(
    session: AsyncSession,
    *,
    organization_id: UUID,
    phone: str,
) -> None:
    normalized = normalize_phone(phone)
    if not normalized:
        raise_api_error("validation_error")

    entry = await get_active_entry(
        session,
        organization_id=organization_id,
        phone=normalized,
    )
    if entry is None:
        raise_api_error("not_found")

    entry.withdrawn_at = utc_now()
    entry.updated_at = utc_now()
    session.add(entry)
    await session.commit()
