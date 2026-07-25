"""FastAPI auth dependencies (``Depends``)."""

from __future__ import annotations

from collections.abc import Callable
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_db
from app.lib.security.access import ensure_organization_access, load_user_by_id
from app.lib.security.tokens import decode_access_token
from app.models.organization.enums import OrganizationType
from app.models.organization.organization import Organization
from app.models.user.user import User

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    token = credentials.credentials.strip() if credentials else None
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        user_id = decode_access_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Not authenticated") from None
    user = await load_user_by_id(session, user_id)
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
