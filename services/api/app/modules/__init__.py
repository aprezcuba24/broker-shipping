from app.lib import AppModule
from app.modules.organization.module import OrganizationModule
from app.modules.products.module import ProductsModule
from app.modules.user.module import UserModule


def get_app_modules() -> tuple[AppModule, ...]:
    return (
        ProductsModule(),
        UserModule(),
        OrganizationModule(),
    )


__all__ = [
    "AppModule",
    "OrganizationModule",
    "ProductsModule",
    "UserModule",
    "get_app_modules",
]
