from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_db
from app.lib.security.deps import SellerOrgDep
from app.schemas.organization import OrganizationPublic
from app.services import provider_seller_link as link_service

router = APIRouter(prefix="/organizations/seller", tags=["organizations"])


@router.get("/providers", response_model=list[OrganizationPublic])
async def list_providers(
    organization: SellerOrgDep,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> list[OrganizationPublic]:
    providers = await link_service.list_linked_provider_organizations(
        session,
        organization.id,
    )
    return [OrganizationPublic.model_validate(org) for org in providers]
