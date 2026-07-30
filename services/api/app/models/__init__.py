from sqlmodel import SQLModel

from app.models import customer, location, order, organization, product, user


def get_all_table_models() -> tuple[type[SQLModel], ...]:
    """Return all SQLModel table classes registered across domain packages."""
    return (
        *user.DOMAIN_MODELS,
        *organization.DOMAIN_MODELS,
        *product.DOMAIN_MODELS,
        *location.DOMAIN_MODELS,
        *customer.DOMAIN_MODELS,
        *order.DOMAIN_MODELS,
    )


__all__ = ["get_all_table_models"]
