"""FastAPI auth dependencies (``Depends``)."""

from __future__ import annotations

from collections.abc import Callable
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_db
from app.lib.security.access import ensure_organization_access, load_user_by_id
from app.lib.security.api_keys import split_raw
from app.lib.security.tokens import decode_access_token
from app.models.organization.enums import OrganizationType
from app.models.organization.organization import Organization
from app.models.user.user import User
from app.services import api_key as api_key_service

bearer_scheme = HTTPBearer(auto_error=False)
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

_JWT_REQUIRED_DETAIL = "JWT required"


async def _get_user_from_jwt(
    credentials: HTTPAuthorizationCredentials | None,
    session: AsyncSession,
) -> User | None:
    token = credentials.credentials.strip() if credentials else None
    if not token:
        return None
    try:
        user_id = decode_access_token(token)
    except ValueError:
        return None
    return await load_user_by_id(session, user_id)


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ],
    raw_key: Annotated[str | None, Depends(api_key_header)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    user = await _get_user_from_jwt(credentials, session)
    if user is not None:
        return user

    if raw_key and split_raw(raw_key) is not None:
        key = await api_key_service.verify_raw(session, raw_key)
        if key is not None:
            creator = await load_user_by_id(session, key.created_by_user_id)
            if creator is not None:
                await api_key_service.touch_last_used(session, key)
                return creator

    raise HTTPException(status_code=401, detail="Not authenticated")


async def get_jwt_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ],
    raw_key: Annotated[str | None, Depends(api_key_header)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    if raw_key and split_raw(raw_key) is not None:
        token = credentials.credentials.strip() if credentials else None
        if not token:
            raise HTTPException(status_code=403, detail=_JWT_REQUIRED_DETAIL)

    user = await _get_user_from_jwt(credentials, session)
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def require_organization(
    org_type: OrganizationType | None = None,
) -> Callable[..., Organization]:
    async def _resolve(
        organization_id: UUID,
        user: Annotated[User, Depends(get_current_user)],
        session: Annotated[AsyncSession, Depends(get_db)],
    ) -> Organization:
        return await ensure_organization_access(
            session,
            user,
            organization_id=organization_id,
            required_org_type=org_type,
        )

    return _resolve


async def optional_seller_organization(
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    organization_id: UUID | None = None,
) -> Organization | None:
    if organization_id is None:
        return None
    return await ensure_organization_access(
        session,
        user,
        organization_id=organization_id,
        required_org_type=OrganizationType.seller,
    )


CurrentUserDep = Annotated[User, Depends(get_current_user)]
JwtUserDep = Annotated[User, Depends(get_jwt_user)]
ProviderOrgDep = Annotated[
    Organization,
    Depends(require_organization(OrganizationType.provider)),
]
SellerOrgDep = Annotated[
    Organization,
    Depends(require_organization(OrganizationType.seller)),
]
OptionalSellerOrgDep = Annotated[
    Organization | None,
    Depends(optional_seller_organization),
]
