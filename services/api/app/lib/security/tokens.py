from __future__ import annotations

from datetime import timedelta
from uuid import UUID

from authx import AuthX, AuthXConfig
from authx.exceptions import JWTDecodeError

from app.config import settings

_config = AuthXConfig(
    JWT_SECRET_KEY=settings.jwt_secret_key,
    JWT_ALGORITHM=settings.jwt_algorithm,  # type: ignore[arg-type]
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(minutes=settings.jwt_access_token_minutes),
    JWT_TOKEN_LOCATION=["headers"],
)

auth = AuthX(config=_config)


def encode_access_token(user_id: UUID) -> str:
    return auth.create_access_token(uid=str(user_id))


def decode_access_token_from_string(token: str) -> UUID:
    from authx.schema import RequestToken

    try:
        payload = auth.verify_token(RequestToken(token=token, location="headers"))
    except JWTDecodeError as exc:
        msg = "Invalid or expired token"
        raise ValueError(msg) from exc
    return UUID(payload.sub)
