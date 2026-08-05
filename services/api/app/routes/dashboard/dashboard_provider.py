from typing import Annotated

from fastapi import APIRouter, Query

from app.deps import SessionDep
from app.lib.security.deps import ProviderOrgDep
from app.schemas.dashboard import ProviderDashboardPublic
from app.services.dashboard import provider as provider_dashboard_service
from app.types import DashboardPeriod

router = APIRouter(prefix="/dashboard/provider", tags=["dashboard"])


@router.get("/", response_model=ProviderDashboardPublic)
async def get_provider_dashboard(
    organization: ProviderOrgDep,
    session: SessionDep,
    period: Annotated[DashboardPeriod, Query()] = "30d",
) -> ProviderDashboardPublic:
    return await provider_dashboard_service.get_provider_dashboard(
        session,
        organization.id,
        period=period,
    )
