from app.lib import AppModule
from app.modules.organization.module import OrganizationModule
from app.modules.products.module import ProductsModule

app_modules: tuple[AppModule, ...] = (
    ProductsModule(),
    OrganizationModule(),
)

__all__ = ["AppModule", "OrganizationModule", "ProductsModule", "app_modules"]
