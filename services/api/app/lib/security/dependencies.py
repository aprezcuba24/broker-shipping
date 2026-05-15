from __future__ import annotations

from uuid import UUID

from dishka import FromDishka
from dishka.integrations.fastapi import inject
from fastapi import HTTPException, Request
from fastapi.security import APIKeyHeader

from app.lib.security.api_keys import split_raw
from app.lib.security.principal import ApiKeyPrincipal, Principal, UserPrincipal
from app.lib.security.tokens import decode_access_token_from_string
from app.modules.organization.services.api_key_service import ApiKeyService
from app.modules.user.repositories.user_repository import UserRepository

_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def _bearer_token(request: Request) -> str | None:
    authz = request.headers.get("Authorization")
    if not authz or not authz.lower().startswith("bearer "):
        return None
    return authz.split(" ", 1)[1].strip()


@inject
async def _resolve_user(
    request: Request,
    user_repo: FromDishka[UserRepository],
) -> UserPrincipal:
    token = _bearer_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        uid = decode_access_token_from_string(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Not authenticated") from None
    user = await user_repo.get_by_id(uid)
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return UserPrincipal(user_id=user.id, username=user.username)


@inject
async def _resolve_api_key(
    request: Request,
    api_key_service: FromDishka[ApiKeyService],
) -> ApiKeyPrincipal:
    raw = await _api_key_header(request)
    if not raw:
        raise HTTPException(status_code=401, detail="API key required")
    key = await api_key_service.verify_raw(raw)
    if key is None:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return ApiKeyPrincipal(
        api_key_id=UUID(str(key.id)),
        organization_id=UUID(str(key.organization_id)),
    )


@inject
async def _resolve_user_or_api_key(
    request: Request,
    user_repo: FromDishka[UserRepository],
    api_key_service: FromDishka[ApiKeyService],
) -> Principal:
    token = _bearer_token(request)
    if token:
        try:
            uid = decode_access_token_from_string(token)
        except ValueError:
            uid = None
        if uid is not None:
            user = await user_repo.get_by_id(uid)
            if user is not None:
                return UserPrincipal(user_id=user.id, username=user.username)
    raw = await _api_key_header(request)
    if raw and split_raw(raw) is not None:
        key = await api_key_service.verify_raw(raw)
        if key is not None:
            return ApiKeyPrincipal(
                api_key_id=UUID(str(key.id)),
                organization_id=UUID(str(key.organization_id)),
            )
    raise HTTPException(status_code=401, detail="Not authenticated")
