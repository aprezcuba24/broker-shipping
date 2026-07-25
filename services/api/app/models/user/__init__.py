from sqlmodel import SQLModel

from app.models.user.api_key import ApiKey
from app.models.user.user import User

DOMAIN_MODELS: tuple[type[SQLModel], ...] = (User, ApiKey)

__all__ = [
    "DOMAIN_MODELS",
    "ApiKey",
    "User",
]
