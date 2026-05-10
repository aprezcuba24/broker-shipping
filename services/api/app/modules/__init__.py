from app.lib import AppModule
from app.modules.organization.module import OrganizationModule
from app.modules.products.module import ProductsModule


def get_app_modules() -> tuple[AppModule, ...]:
    return (
        ProductsModule(),
        OrganizationModule(),
    )


__all__ = [
    "AppModule",
    "OrganizationModule",
    "ProductsModule",
    "get_app_modules",
]
