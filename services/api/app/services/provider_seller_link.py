from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.lib.persistence import get_entity
from app.lib.security.access import is_super_admin, list_all_provider_organization_ids
from app.lib.utils import utc_now
from app.models.commission.commission import Commission
from app.models.organization.enums import OrganizationType
from app.models.organization.organization import Organization
from app.models.organization.provider_seller_link import ProviderSellerLink
from app.models.organization.user_organization import UserOrganization
from app.models.user.user import User

_UNLINK_PENDING_COMMISSIONS_DETAIL = (
    "No se puede desvincular la organización mientras existan "
    "comisiones pendientes de pago."
)


async def has_active_link(
    session: AsyncSession,
    provider_organization_id: UUID,
    seller_organization_id: UUID,
) -> bool:
    result = await session.execute(
        select(ProviderSellerLink).where(
            ProviderSellerLink.provider_organization_id == provider_organization_id,
            ProviderSellerLink.seller_organization_id == seller_organization_id,
            ProviderSellerLink.is_active.is_(True),
        )
    )
    return result.scalar_one_or_none() is not None


async def link_provider_to_seller(
    session: AsyncSession,
    provider_organization_id: UUID,
    seller_organization_id: UUID,
) -> ProviderSellerLink:
    link = await get_entity(
        session,
        ProviderSellerLink,
        provider_organization_id=provider_organization_id,
        seller_organization_id=seller_organization_id,
        required=False,
    )
    if link is None:
        link = ProviderSellerLink(
            provider_organization_id=provider_organization_id,
            seller_organization_id=seller_organization_id,
            is_active=True,
        )
        session.add(link)
    else:
        link.is_active = True
        link.linked_at = utc_now()
        session.add(link)
    await session.flush()
    return link


async def has_pending_commissions(
    session: AsyncSession,
    provider_organization_id: UUID,
    seller_organization_id: UUID,
) -> bool:
    result = await session.execute(
        select(Commission.id).where(
            Commission.provider_organization_id == provider_organization_id,
            Commission.seller_organization_id == seller_organization_id,
            Commission.is_paid.is_(False),
        ).limit(1)
    )
    return result.scalar_one_or_none() is not None


async def set_link_active(
    session: AsyncSession,
    provider_organization_id: UUID,
    seller_organization_id: UUID,
    *,
    is_active: bool,
) -> None:
    if not is_active and await has_pending_commissions(
        session,
        provider_organization_id,
        seller_organization_id,
    ):
        raise HTTPException(
            status_code=409,
            detail=_UNLINK_PENDING_COMMISSIONS_DETAIL,
        )
    link = await get_entity(
        session,
        ProviderSellerLink,
        provider_organization_id=provider_organization_id,
        seller_organization_id=seller_organization_id,
    )
    link.is_active = is_active
    session.add(link)
    await session.commit()


async def list_linked_sellers(
    session: AsyncSession,
    provider_organization_id: UUID,
) -> list[Organization]:
    result = await session.execute(
        select(Organization)
        .join(
            ProviderSellerLink,
            ProviderSellerLink.seller_organization_id == Organization.id,
        )
        .where(
            ProviderSellerLink.provider_organization_id == provider_organization_id,
            ProviderSellerLink.is_active.is_(True),
        )
        .order_by(Organization.name)
    )
    return list(result.scalars().all())


async def seller_ids_with_pending_commissions(
    session: AsyncSession,
    provider_organization_id: UUID,
    seller_organization_ids: list[UUID],
) -> set[UUID]:
    if not seller_organization_ids:
        return set()
    result = await session.execute(
        select(Commission.seller_organization_id).where(
            Commission.provider_organization_id == provider_organization_id,
            Commission.seller_organization_id.in_(seller_organization_ids),
            Commission.is_paid.is_(False),
        ).distinct()
    )
    return set(result.scalars().all())


async def list_active_provider_ids(
    session: AsyncSession,
    seller_organization_id: UUID,
) -> list[UUID]:
    result = await session.execute(
        select(ProviderSellerLink.provider_organization_id).where(
            ProviderSellerLink.seller_organization_id == seller_organization_id,
            ProviderSellerLink.is_active.is_(True),
        )
    )
    return list(result.scalars().all())


async def list_linked_provider_organizations(
    session: AsyncSession,
    seller_organization_id: UUID,
) -> list[Organization]:
    result = await session.execute(
        select(Organization)
        .join(
            ProviderSellerLink,
            ProviderSellerLink.provider_organization_id == Organization.id,
        )
        .where(
            ProviderSellerLink.seller_organization_id == seller_organization_id,
            ProviderSellerLink.is_active.is_(True),
        )
        .order_by(Organization.name)
    )
    return list(result.scalars().all())


async def list_seller_org_ids_for_user(
    session: AsyncSession,
    user_id: UUID,
) -> list[UUID]:
    result = await session.execute(
        select(Organization.id)
        .join(
            UserOrganization,
            UserOrganization.organization_id == Organization.id,
        )
        .where(
            UserOrganization.user_id == user_id,
            UserOrganization.is_active.is_(True),
            Organization.type == OrganizationType.seller,
        )
    )
    return list(result.scalars().all())


async def resolve_provider_ids(
    session: AsyncSession,
    user: User,
    seller_organization_id: UUID | None = None,
) -> list[UUID]:
    """Provider org IDs linked to one seller org, or to all of the user's seller orgs.

    Super admins see every provider organization (membership and links ignored).
    """
    if is_super_admin(user):
        return await list_all_provider_organization_ids(session)

    if seller_organization_id is not None:
        return await list_active_provider_ids(session, seller_organization_id)

    seller_org_ids = await list_seller_org_ids_for_user(session, user.id)
    provider_ids: list[UUID] = []
    seen: set[UUID] = set()
    for seller_org_id in seller_org_ids:
        for provider_id in await list_active_provider_ids(session, seller_org_id):
            if provider_id not in seen:
                seen.add(provider_id)
                provider_ids.append(provider_id)
    return provider_ids
