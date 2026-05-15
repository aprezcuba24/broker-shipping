from sqlmodel import SQLModel

from app.modules.user.models.user import (
    TokenResponse,
    User,
    UserLogin,
    UserPublic,
    UserSignup,
)

MODULE_MODELS: tuple[type[SQLModel], ...] = (User,)

__all__ = [
    "MODULE_MODELS",
    "TokenResponse",
    "User",
    "UserLogin",
    "UserPublic",
    "UserSignup",
]
