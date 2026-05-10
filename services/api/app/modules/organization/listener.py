import logging

from app.lib.event_dispatcher import EventDispatcher
from app.modules.products.events import ProductsModuleRootAccessed

logger = logging.getLogger(__name__)


async def _on_products_module_root_accessed(event: ProductsModuleRootAccessed) -> None:
    logger.info("organization listener: products module root accessed (source=%s)", event.source)


def register_listeners(dispatcher: EventDispatcher) -> None:
    dispatcher.subscribe(ProductsModuleRootAccessed, _on_products_module_root_accessed)
