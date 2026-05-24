from typing import Annotated, Any
from uuid import UUID

from dishka import FromDishka
from dishka.integrations.fastapi import DishkaRoute
from fastapi import APIRouter, Body, Response

from app.lib.security import require_user_or_api_key
from app.modules.products.models import Category
from app.modules.products.services import CategoryService

router = APIRouter(route_class=DishkaRoute)


@router.get("/", response_model=list[Category])
@require_user_or_api_key
async def list_categories(service: FromDishka[CategoryService]):
    return await service.list()


@router.get("/{category_id}", response_model=Category)
@require_user_or_api_key
async def get_category(category_id: UUID, service: FromDishka[CategoryService]):
    return await service.get_or_404(entity_id=category_id, detail="Category not found")


@router.post("/", response_model=Category, status_code=201)
@require_user_or_api_key
async def create_category(body: Category, service: FromDishka[CategoryService]):
    entity = Category(**body.model_dump(exclude=CategoryService.creation_exclude()))
    return await service.create(entity)


@router.patch("/{category_id}", response_model=Category)
@require_user_or_api_key
async def patch_category(
    category_id: UUID,
    payload: Annotated[dict[str, Any], Body(...)],
    service: FromDishka[CategoryService],
):
    return await service.get_or_404(
        entity=await service.patch(
            category_id,
            payload,
            allowed_keys=CategoryService.patch_allowed_keys(),
        ),
        detail="Category not found",
    )


@router.delete("/{category_id}", status_code=204)
@require_user_or_api_key
async def delete_category(category_id: UUID, service: FromDishka[CategoryService]):
    await service.get_or_404(entity_id=category_id, detail="Category not found")
    await service.delete(category_id)
    return Response(status_code=204)
