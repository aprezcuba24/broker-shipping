from typing import Annotated, Any
from uuid import UUID

from dishka import FromDishka
from dishka.integrations.fastapi import DishkaRoute
from fastapi import APIRouter, Body, Depends, Response

from app.lib.security.deps import get_user, require_organization
from app.modules.organization.models import Organization, OrganizationType
from app.modules.organization.services import OrganizationService
from app.modules.user.models import User

router = APIRouter(route_class=DishkaRoute)


@router.post("/", response_model=Organization, status_code=201)
async def create_organization(
    body: Organization,
    service: FromDishka[OrganizationService],
    user: Annotated[User, Depends(get_user)],
):
    entity = Organization(**body.model_dump(exclude=OrganizationService.creation_exclude()))
    return await service.create_for_user(entity, user.id)


@router.get("/", response_model=list[Organization])
async def list_organizations(
    service: FromDishka[OrganizationService],
    user: Annotated[User, Depends(get_user)],
):
    rows = await service.list_for_user(user.id)
    return list(rows)


@router.patch(
    "/{organization_id}",
    response_model=Organization,
    dependencies=[Depends(require_organization(OrganizationType.provider))],
)
async def patch_organization(
    organization_id: UUID,
    payload: Annotated[dict[str, Any], Body(...)],
    service: FromDishka[OrganizationService],
):
    await service.get_or_404(entity_id=organization_id)
    return await service.update_for_user(organization_id, payload)


@router.delete(
    "/{organization_id}",
    status_code=204,
    dependencies=[Depends(require_organization(OrganizationType.provider))],
)
async def delete_organization(
    organization_id: UUID,
    service: FromDishka[OrganizationService],
):
    entity = await service.get_or_404(entity_id=organization_id)
    await service.delete_for_user(entity)
    return Response(status_code=204)
