from sqlmodel import SQLModel

from app.modules.products.models.category import Category
from app.modules.products.models.product import (
    PRODUCT_LIST_FILTER_SPEC,
    SELLER_PRODUCT_LIST_FILTER_SPEC,
    Product,
    ProductCreate,
    ProductListFilters,
    SellerProductListFilters,
    product_list_filters,
    seller_product_list_filters,
)

MODULE_MODELS: tuple[type[SQLModel], ...] = (Product, Category)

__all__ = [
    "MODULE_MODELS",
    "PRODUCT_LIST_FILTER_SPEC",
    "SELLER_PRODUCT_LIST_FILTER_SPEC",
    "Category",
    "Product",
    "ProductCreate",
    "ProductListFilters",
    "SellerProductListFilters",
    "product_list_filters",
    "seller_product_list_filters",
]
