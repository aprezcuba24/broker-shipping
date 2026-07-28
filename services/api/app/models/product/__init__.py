from sqlmodel import SQLModel

from app.models.product.product import Product

DOMAIN_MODELS: tuple[type[SQLModel], ...] = (Product,)

__all__ = [
    "DOMAIN_MODELS",
    "Product",
]
