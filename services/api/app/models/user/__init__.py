from sqlmodel import SQLModel

from app.models.user.user import User

DOMAIN_MODELS: tuple[type[SQLModel], ...] = (User,)

__all__ = [
    "DOMAIN_MODELS",
    "User",
]
