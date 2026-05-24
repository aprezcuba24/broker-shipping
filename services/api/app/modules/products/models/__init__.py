from sqlmodel import SQLModel

from app.modules.products.models.category import Category
from app.modules.products.models.product import Product

MODULE_MODELS: tuple[type[SQLModel], ...] = (Product, Category)

__all__ = ["MODULE_MODELS", "Category", "Product"]
