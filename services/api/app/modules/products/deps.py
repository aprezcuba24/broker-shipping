from typing import Annotated

from fastapi import Depends

from app.lib.db_utils import make_service_depends
from app.modules.products.repositories import ProductRepository
from app.modules.products.services import ProductService

_get_product_service = make_service_depends(
    ProductService, ProductRepository, with_events=True
)
ProductServiceDep = Annotated[ProductService, Depends(_get_product_service)]
