from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

from app.events.names import PRODUCTS_MODULE_ROOT_ACCESSED
from app.lib.dependencies import EventDispatcherDep

router = APIRouter()


@router.get("/", response_class=PlainTextResponse)
async def module_root(dispatcher: EventDispatcherDep) -> str:
    await dispatcher.emit(PRODUCTS_MODULE_ROOT_ACCESSED, source="products")
    return "products"
