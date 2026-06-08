from uuid import UUID

from dishka import FromDishka
from dishka.integrations.fastapi import DishkaRoute
from fastapi import APIRouter, Depends

from app.lib.security.deps import require_user
from app.modules.products.models import Category
from app.modules.products.services import CategoryService

router = APIRouter(route_class=DishkaRoute)


@router.get(
    "/{provider_id}",
    response_model=list[Category],
    dependencies=[Depends(require_user)],
)
async def list_categories(
    provider_id: UUID,
    service: FromDishka[CategoryService],
):
    return await service.list_for_organization(provider_id)
