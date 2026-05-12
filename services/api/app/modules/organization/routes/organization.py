from dishka import FromDishka
from dishka.integrations.fastapi import DishkaRoute
from fastapi import APIRouter

from app.modules.organization.models import Organization
from app.modules.organization.services import OrganizationService

router = APIRouter(route_class=DishkaRoute)


@router.post("/", response_model=Organization, status_code=201)
async def create_organization(body: Organization, service: FromDishka[OrganizationService]):
    return await service.create(body)
