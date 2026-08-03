from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.persistence import get_entity
from app.lib.persistence.pagination import paginate
from app.lib.utils import utc_now
from app.models.commission.commission import Commission
from app.schemas.pagination import PageResult, PaginationParams
from app.services.commission.helpers import attach_items_to_commissions


async def list_commissions_for_provider(
    session: AsyncSession,
    provider_organization_id: UUID,
    *,
    pagination: PaginationParams,
    is_paid: bool | None = False,
) -> PageResult[Commission]:
    """List commissions the provider must pay.

    Default ``is_paid=False`` shows unpaid commissions only.
    """
    stmt = select(Commission).where(
        Commission.provider_organization_id == provider_organization_id
    )
    if is_paid is not None:
        stmt = stmt.where(Commission.is_paid.is_(is_paid))
    stmt = stmt.order_by(Commission.created_at.desc(), Commission.id.desc())
    result = await paginate(session, stmt, pagination)
    await attach_items_to_commissions(session, result.items)
    return result


async def get_commission_for_provider(
    session: AsyncSession,
    commission_id: UUID,
    provider_organization_id: UUID,
) -> Commission:
    commission = await get_entity(
        session,
        Commission,
        id=commission_id,
        provider_organization_id=provider_organization_id,
    )
    await attach_items_to_commissions(session, [commission])
    return commission


async def mark_commission_paid(
    session: AsyncSession,
    commission_id: UUID,
    provider_organization_id: UUID,
) -> Commission:
    commission = await get_entity(
        session,
        Commission,
        id=commission_id,
        provider_organization_id=provider_organization_id,
    )
    if commission.is_paid:
        raise HTTPException(status_code=400, detail="Commission already paid")

    now = utc_now()
    commission.is_paid = True
    commission.paid_at = now
    commission.updated_at = now
    session.add(commission)
    await session.commit()
    await session.refresh(commission)
    await attach_items_to_commissions(session, [commission])
    return commission
