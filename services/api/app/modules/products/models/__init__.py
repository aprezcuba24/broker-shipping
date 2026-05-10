from sqlmodel import SQLModel

from app.modules.products.models.product import Product

MODULE_MODELS: tuple[type[SQLModel], ...] = (Product,)

__all__ = ["MODULE_MODELS", "Product"]
