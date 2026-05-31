from typing import Annotated, Any
from uuid import UUID

from dishka import FromDishka
from dishka.integrations.fastapi import DishkaRoute
from fastapi import APIRouter, Body, Response

from app.lib.security import require_user
from app.modules.organization.models import OrgMemberRole, Organization
from app.modules.user.models import User
from app.modules.organization.services import OrganizationService

router = APIRouter(route_class=DishkaRoute)


@router.post("/", response_model=Organization, status_code=201)
@require_user
async def create_organization(
    body: Organization,
    service: FromDishka[OrganizationService],
    user: User,
):
    entity = Organization(**body.model_dump(exclude=OrganizationService.creation_exclude()))
    return await service.create_for_user(entity, user.id)


@router.get("/", response_model=list[Organization])
@require_user
async def list_organizations(
    service: FromDishka[OrganizationService],
    user: User,
):
    rows = await service.list_for_user(user.id)
    return list(rows)


@router.patch("/{organization_id}", response_model=Organization)
@require_user(OrgMemberRole.provider)
async def patch_organization(
    organization_id: UUID,
    payload: Annotated[dict[str, Any], Body(...)],
    service: FromDishka[OrganizationService],
):
    await service.get_or_404(entity_id=organization_id)
    return await service.update_for_user(organization_id, payload)


@router.delete("/{organization_id}", status_code=204)
@require_user(OrgMemberRole.provider)
async def delete_organization(
    organization_id: UUID,
    service: FromDishka[OrganizationService],
):
    organization = await service.get_or_404(entity_id=organization_id)
    await service.delete_for_user(organization)
    return Response(status_code=204)
