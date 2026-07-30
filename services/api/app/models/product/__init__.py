from sqlmodel import SQLModel

from app.models.product.product import Product
from app.models.product.product_tag import ProductTag
from app.models.product.tag import Tag

DOMAIN_MODELS: tuple[type[SQLModel], ...] = (Product, ProductTag, Tag)

__all__ = [
    "DOMAIN_MODELS",
    "Product",
    "ProductTag",
    "Tag",
]
