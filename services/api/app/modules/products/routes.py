from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse
from sqlalchemy import select

from app.lib.dependencies import EventDispatcherDep, SessionDep
from app.modules.products.events import ProductsModuleRootAccessed
from app.modules.products.models import Product

router = APIRouter()


@router.get("/", response_class=PlainTextResponse)
async def module_root(dispatcher: EventDispatcherDep) -> str:
    await dispatcher.emit(ProductsModuleRootAccessed(source="products"))
    return "products"


@router.get("/{product_id}", response_model=Product)
async def get_product(product_id: UUID, session: SessionDep) -> Product:
    result = await session.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product
