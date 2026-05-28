from sqlmodel import SQLModel

from app.modules.products.models.category import Category
from app.modules.products.models.product import (
    PRODUCT_LIST_FILTER_SPEC,
    Product,
    ProductListFilters,
    product_list_filters,
)

MODULE_MODELS: tuple[type[SQLModel], ...] = (Product, Category)

__all__ = [
    "MODULE_MODELS",
    "PRODUCT_LIST_FILTER_SPEC",
    "Category",
    "Product",
    "ProductListFilters",
    "product_list_filters",
]
