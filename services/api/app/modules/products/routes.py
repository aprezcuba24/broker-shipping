from fastapi import APIRouter

from app.modules.products.deps import ProductServiceDep
from app.modules.products.models import Product

router = APIRouter()


@router.post("/", response_model=Product, status_code=201)
async def create_product(body: Product, service: ProductServiceDep):
    return await service.create(body)
