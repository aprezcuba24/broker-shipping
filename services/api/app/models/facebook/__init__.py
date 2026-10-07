from sqlmodel import SQLModel

from app.models.facebook.facebook_group import FacebookGroup

DOMAIN_MODELS: tuple[type[SQLModel], ...] = (FacebookGroup,)

__all__ = [
    "DOMAIN_MODELS",
    "FacebookGroup",
]
