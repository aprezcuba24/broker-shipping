from sqlmodel import SQLModel

from app.models import (
    ads,
    commission,
    customer,
    facebook,
    location,
    messaging,
    order,
    organization,
    platform,
    product,
    product_stock_movement,
    user,
)


def get_all_table_models() -> tuple[type[SQLModel], ...]:
    """Return all SQLModel table classes registered across domain packages."""
    return (
        *user.DOMAIN_MODELS,
        *organization.DOMAIN_MODELS,
        *platform.DOMAIN_MODELS,
        *product.DOMAIN_MODELS,
        *location.DOMAIN_MODELS,
        *customer.DOMAIN_MODELS,
        *order.DOMAIN_MODELS,
        *commission.DOMAIN_MODELS,
        *product_stock_movement.DOMAIN_MODELS,
        *messaging.DOMAIN_MODELS,
        *facebook.DOMAIN_MODELS,
        *ads.DOMAIN_MODELS,
    )


__all__ = ["get_all_table_models"]
