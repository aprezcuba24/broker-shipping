from typing import Annotated, Any
from uuid import UUID

from dishka import FromDishka
from dishka.integrations.fastapi import DishkaRoute
from fastapi import APIRouter, Body, Response

from app.modules.products.models import Product
from app.modules.products.services import ProductService

router = APIRouter(route_class=DishkaRoute)


@router.get("/", response_model=list[Product])
async def list_products(service: FromDishka[ProductService]):
    return await service.list()


@router.get("/{product_id}", response_model=Product)
async def get_product(product_id: UUID, service: FromDishka[ProductService]):
    return await service.get_or_404(entity_id=product_id, detail="Product not found")


@router.post("/", response_model=Product, status_code=201)
async def create_product(body: Product, service: FromDishka[ProductService]):
    entity = Product(**body.model_dump(exclude=ProductService.creation_exclude()))
    return await service.create(entity)


@router.patch("/{product_id}", response_model=Product)
async def patch_product(
    product_id: UUID,
    payload: Annotated[dict[str, Any], Body(...)],
    service: FromDishka[ProductService],
):
    return await service.get_or_404(
        entity=await service.patch(
            product_id,
            payload,
            allowed_keys=ProductService.patch_allowed_keys(),
        ),
        detail="Product not found",
    )


@router.delete("/{product_id}", status_code=204)
async def delete_product(product_id: UUID, service: FromDishka[ProductService]):
    await service.get_or_404(entity_id=product_id, detail="Product not found")
    await service.delete(product_id)
    return Response(status_code=204)
