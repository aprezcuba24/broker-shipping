from uuid import UUID

from fastapi import APIRouter

from app.deps import SessionDep
from app.lib.persistence.pagination import PaginationDep
from app.lib.security.deps import SellerOrgDep
from app.schemas.commission import CommissionPublic
from app.schemas.pagination import Page
from app.services.commission import seller as seller_commission_service

router = APIRouter(prefix="/commissions/seller", tags=["commissions"])


@router.get("/", response_model=Page[CommissionPublic])
async def list_commissions(
    organization: SellerOrgDep,
    session: SessionDep,
    pagination: PaginationDep,
    is_paid: bool | None = None,
) -> Page[CommissionPublic]:
    result = await seller_commission_service.list_commissions_for_seller(
        session,
        organization.id,
        pagination=pagination,
        is_paid=is_paid,
    )
    return Page.from_mapped(result, pagination, CommissionPublic.model_validate)


@router.get("/{commission_id}", response_model=CommissionPublic)
async def get_commission(
    commission_id: UUID,
    organization: SellerOrgDep,
    session: SessionDep,
) -> CommissionPublic:
    commission = await seller_commission_service.get_commission_for_seller(
        session,
        commission_id,
        organization.id,
    )
    return CommissionPublic.model_validate(commission)
