from typing import Annotated

from fastapi import APIRouter, Query

from app.deps import SessionDep
from app.lib.security.deps import CurrentUserDep, SellerOrgDep
from app.schemas.dashboard import SellerDashboardPublic
from app.services.dashboard import seller as seller_dashboard_service
from app.types import DashboardPeriod

router = APIRouter(prefix="/dashboard/seller", tags=["dashboard"])


@router.get("/", response_model=SellerDashboardPublic)
async def get_seller_dashboard(
    organization: SellerOrgDep,
    user: CurrentUserDep,
    session: SessionDep,
    period: Annotated[DashboardPeriod, Query()] = "30d",
) -> SellerDashboardPublic:
    return await seller_dashboard_service.get_seller_dashboard(
        session,
        user,
        organization.id,
        period=period,
    )
