from sqlmodel import SQLModel

from app.models import organization, product, user


def get_all_table_models() -> tuple[type[SQLModel], ...]:
    """Return all SQLModel table classes registered across domain packages."""
    return (
        *user.DOMAIN_MODELS,
        *organization.DOMAIN_MODELS,
        *product.DOMAIN_MODELS,
    )


__all__ = ["get_all_table_models"]
