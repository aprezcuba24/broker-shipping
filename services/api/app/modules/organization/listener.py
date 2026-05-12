import logging

from app.lib.event_dispatcher import EventDispatcher
from app.modules.products.events import ProductCreated

logger = logging.getLogger(__name__)


async def _on_product_created(event: ProductCreated) -> None:
    logger.info("organization noticed new product: id=%s", event.entity.id)


def register_listeners(dispatcher: EventDispatcher) -> None:
    dispatcher.subscribe(ProductCreated, _on_product_created)
