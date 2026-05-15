"""Security primitives (JWT + API keys). Heavy decorators load lazily via ``__getattr__``."""

from __future__ import annotations

from typing import Any

from app.lib.security.principal import ApiKeyPrincipal, Principal, UserPrincipal

__all__ = [
    "ApiKeyPrincipal",
    "Principal",
    "UserPrincipal",
    "require_api_key",
    "require_user",
    "require_user_or_api_key",
]


def __getattr__(name: str) -> Any:
    if name == "require_user":
        from app.lib.security.decorators import require_user

        return require_user
    if name == "require_api_key":
        from app.lib.security.decorators import require_api_key

        return require_api_key
    if name == "require_user_or_api_key":
        from app.lib.security.decorators import require_user_or_api_key

        return require_user_or_api_key
    msg = f"module {__name__!r} has no attribute {name!r}"
    raise AttributeError(msg)
