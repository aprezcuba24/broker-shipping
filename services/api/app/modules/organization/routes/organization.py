from dishka import FromDishka
from dishka.integrations.fastapi import DishkaRoute
from fastapi import APIRouter

from app.lib.security import UserPrincipal, require_user
from app.modules.organization.models import Organization
from app.modules.organization.services import OrganizationService

router = APIRouter(route_class=DishkaRoute)


@router.post("/", response_model=Organization, status_code=201)
@require_user
async def create_organization(
    body: Organization,
    service: FromDishka[OrganizationService],
    principal: UserPrincipal,
):
    entity = Organization(**body.model_dump(exclude=OrganizationService.creation_exclude()))
    return await service.create_for_user(entity, principal.user_id)


@router.get("/", response_model=list[Organization])
@require_user
async def list_organizations(
    service: FromDishka[OrganizationService],
    principal: UserPrincipal,
):
    rows = await service.list_for_user(principal.user_id)
    return list(rows)
