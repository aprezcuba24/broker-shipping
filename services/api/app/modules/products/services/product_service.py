from app.lib.base_service import BaseService
from app.modules.products.events import ProductCreated
from app.modules.products.models import Product


class ProductService(BaseService[Product]):
    async def on_create(self, entity: Product) -> None:
        self.post_commit_emit(ProductCreated(entity=entity))
