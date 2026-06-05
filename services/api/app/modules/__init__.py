from app.lib import AppModule


def get_app_modules() -> tuple[AppModule, ...]:
    from app.modules.orders.module import OrdersModule
    from app.modules.organization.module import OrganizationModule
    from app.modules.products.module import ProductsModule
    from app.modules.user.module import UserModule

    return (
        ProductsModule(),
        UserModule(),
        OrganizationModule(),
        OrdersModule(),
    )


__all__ = [
    "AppModule",
    "get_app_modules",
]
