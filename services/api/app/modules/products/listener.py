import logging

from dishka import FromDishka
from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.event_dispatcher import EventDispatcher
from app.modules.products.events import ProductCreated

logger = logging.getLogger(__name__)


async def _on_product_created(
    event: ProductCreated,
    session: FromDishka[AsyncSession],  # noqa: ARG001 — available for DB work
) -> None:
    logger.info("product created: id=%s name=%s", event.entity.id, event.entity.name)


def register_listeners(dispatcher: EventDispatcher) -> None:
    dispatcher.subscribe(ProductCreated, _on_product_created)
