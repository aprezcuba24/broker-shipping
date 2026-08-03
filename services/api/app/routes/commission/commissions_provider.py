from uuid import UUID

from fastapi import APIRouter

from app.deps import SessionDep
from app.lib.persistence.pagination import PaginationDep
from app.lib.security.deps import ProviderOrgDep
from app.schemas.commission import CommissionMarkPaid, CommissionPublic
from app.schemas.pagination import Page
from app.services.commission import provider as provider_commission_service

router = APIRouter(prefix="/commissions/provider", tags=["commissions"])


@router.get("/", response_model=Page[CommissionPublic])
async def list_commissions(
    organization: ProviderOrgDep,
    session: SessionDep,
    pagination: PaginationDep,
    is_paid: bool | None = False,
) -> Page[CommissionPublic]:
    result = await provider_commission_service.list_commissions_for_provider(
        session,
        organization.id,
        pagination=pagination,
        is_paid=is_paid,
    )
    return Page.from_mapped(result, pagination, CommissionPublic.model_validate)


@router.get("/{commission_id}", response_model=CommissionPublic)
async def get_commission(
    commission_id: UUID,
    organization: ProviderOrgDep,
    session: SessionDep,
) -> CommissionPublic:
    commission = await provider_commission_service.get_commission_for_provider(
        session,
        commission_id,
        organization.id,
    )
    return CommissionPublic.model_validate(commission)


@router.patch("/{commission_id}", response_model=CommissionPublic)
async def mark_commission_paid(
    commission_id: UUID,
    organization: ProviderOrgDep,
    session: SessionDep,
    body: CommissionMarkPaid | None = None,
) -> CommissionPublic:
    _ = body
    commission = await provider_commission_service.mark_commission_paid(
        session,
        commission_id,
        organization.id,
    )
    return CommissionPublic.model_validate(commission)
