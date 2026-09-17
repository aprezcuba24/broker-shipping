from sqlmodel import SQLModel

from app.models.product_reception.product_reception import ProductReception
from app.models.product_reception.product_reception_item import ProductReceptionItem

DOMAIN_MODELS: tuple[type[SQLModel], ...] = (ProductReception, ProductReceptionItem)

__all__ = [
    "DOMAIN_MODELS",
    "ProductReception",
    "ProductReceptionItem",
]
