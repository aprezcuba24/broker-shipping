from typing import Annotated, Any
from uuid import UUID

from dishka import FromDishka
from dishka.integrations.fastapi import DishkaRoute
from fastapi import APIRouter, Body, HTTPException, Response
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.security import require_user_or_api_key
from app.modules.organization.models import Organization
from app.modules.products.models import Category
from app.modules.products.services import CategoryService

router = APIRouter(route_class=DishkaRoute)


@router.get("/", response_model=list[Category])
@require_user_or_api_key
async def list_categories(
    service: FromDishka[CategoryService],
    organization: Organization,
):
    return await service.list_for_organization(organization.id)


@router.get("/{category_id}", response_model=Category)
@require_user_or_api_key
async def get_category(
    category_id: UUID,
    service: FromDishka[CategoryService],
    organization: Organization,
):
    return await service.get_or_404_for_organization(
        category_id,
        organization.id,
        detail="Category not found",
    )


@router.post("/", response_model=Category, status_code=201)
@require_user_or_api_key
async def create_category(
    body: Category,
    service: FromDishka[CategoryService],
    organization: Organization,
):
    entity = Category(
        **body.model_dump(exclude=CategoryService.creation_exclude()),
        organization_id=organization.id,
    )
    return await service.create(entity)


@router.patch("/{category_id}", response_model=Category)
@require_user_or_api_key
async def patch_category(
    category_id: UUID,
    payload: Annotated[dict[str, Any], Body(...)],
    service: FromDishka[CategoryService],
    organization: Organization,
):
    await service.get_or_404_for_organization(
        category_id,
        organization.id,
        detail="Category not found",
    )
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
async def delete_category(
    category_id: UUID,
    service: FromDishka[CategoryService],
    session: FromDishka[AsyncSession],
    organization: Organization,
):
    await service.get_or_404_for_organization(
        category_id,
        organization.id,
        detail="Category not found",
    )
    try:
        await service.delete(category_id)
    except IntegrityError as error:
        await session.rollback()
        raise HTTPException(
            status_code=400,
            detail="Cannot delete category with associated products",
        ) from error
    return Response(status_code=204)
