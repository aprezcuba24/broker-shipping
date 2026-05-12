from dishka import FromDishka
from dishka.integrations.fastapi import DishkaRoute
from fastapi import APIRouter

from app.modules.products.models import Product
from app.modules.products.services import ProductService

router = APIRouter(route_class=DishkaRoute)


@router.post("/", response_model=Product, status_code=201)
async def create_product(body: Product, service: FromDishka[ProductService]):
    return await service.create(body)
