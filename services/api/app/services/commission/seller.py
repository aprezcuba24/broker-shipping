from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.persistence import get_entity
from app.lib.persistence.pagination import paginate
from app.models.commission.commission import Commission
from app.schemas.pagination import PageResult, PaginationParams
from app.services.commission.helpers import attach_items_to_commissions


async def list_commissions_for_seller(
    session: AsyncSession,
    seller_organization_id: UUID,
    *,
    pagination: PaginationParams,
    is_paid: bool | None = None,
) -> PageResult[Commission]:
    stmt = select(Commission).where(
        Commission.seller_organization_id == seller_organization_id
    )
    if is_paid is not None:
        stmt = stmt.where(Commission.is_paid.is_(is_paid))
    stmt = stmt.order_by(Commission.created_at.desc(), Commission.id.desc())
    result = await paginate(session, stmt, pagination)
    await attach_items_to_commissions(session, result.items)
    return result


async def get_commission_for_seller(
    session: AsyncSession,
    commission_id: UUID,
    seller_organization_id: UUID,
) -> Commission:
    commission = await get_entity(
        session,
        Commission,
        id=commission_id,
        seller_organization_id=seller_organization_id,
    )
    await attach_items_to_commissions(session, [commission])
    return commission
