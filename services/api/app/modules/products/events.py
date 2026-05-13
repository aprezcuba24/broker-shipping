from app.lib.event_base import EntityEvent
from app.modules.products.models import Product


class ProductCreated(EntityEvent[Product]):
    """Emitted after a new Product row is committed to the database."""
