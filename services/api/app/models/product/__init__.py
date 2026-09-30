from sqlmodel import SQLModel

from app.models.product.product import Product
from app.models.product.product_tag import ProductTag
from app.models.product.seller_product import SellerProduct
from app.models.product.tag import Tag

DOMAIN_MODELS: tuple[type[SQLModel], ...] = (
    Product,
    ProductTag,
    SellerProduct,
    Tag,
)

__all__ = [
    "DOMAIN_MODELS",
    "Product",
    "ProductTag",
    "SellerProduct",
    "Tag",
]
