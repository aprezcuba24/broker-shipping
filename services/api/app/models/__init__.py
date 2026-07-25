from sqlmodel import SQLModel

from app.models import product


def get_all_table_models() -> tuple[type[SQLModel], ...]:
    """Return all SQLModel table classes registered across domain packages."""
    return product.DOMAIN_MODELS


__all__ = ["get_all_table_models"]
