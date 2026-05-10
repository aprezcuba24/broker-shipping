from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

from app.lib.dependencies import EventDispatcherDep
from app.modules.products.events import ProductsModuleRootAccessed

router = APIRouter()


@router.get("/", response_class=PlainTextResponse)
async def module_root(dispatcher: EventDispatcherDep) -> str:
    await dispatcher.emit(ProductsModuleRootAccessed(source="products"))
    return "products"
