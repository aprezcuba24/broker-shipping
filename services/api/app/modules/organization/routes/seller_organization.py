from typing import Annotated

from dishka import FromDishka
from dishka.integrations.fastapi import DishkaRoute
from fastapi import APIRouter, Depends

from app.lib.security.deps import get_tenant
from app.modules.organization.models import Organization, OrganizationType
from app.modules.organization.services import ProviderSellerLinkService

router = APIRouter(route_class=DishkaRoute)


@router.get("/providers", response_model=list[Organization])
async def list_providers(
    link_service: FromDishka[ProviderSellerLinkService],
    organization: Annotated[Organization, Depends(get_tenant(OrganizationType.seller))],
):
    return await link_service.list_linked_provider_organizations(organization.id)
