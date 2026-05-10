import logging
from typing import Any

from app.events.names import PRODUCTS_MODULE_ROOT_ACCESSED
from app.lib.event_dispatcher import EventDispatcher

logger = logging.getLogger(__name__)


async def _on_products_module_root_accessed(*, source: str = "", **_kwargs: Any) -> None:
    logger.info("organization listener: products module root accessed (source=%s)", source)


def register_listeners(dispatcher: EventDispatcher) -> None:
    dispatcher.subscribe(PRODUCTS_MODULE_ROOT_ACCESSED, _on_products_module_root_accessed)
