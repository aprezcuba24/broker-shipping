"""Auth helpers without FastAPI ``Depends`` (JWT, org membership, loaders)."""

from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.lib.headers import optional_stripped_str
from app.lib.security.tokens import decode_access_token_from_string
from app.modules.organization.models.enums import OrganizationType
from app.modules.organization.models.organization import Organization
from app.modules.organization.repositories.organization_repository import OrganizationRepository
from app.modules.organization.repositories.user_organization_repository import (
    UserOrganizationRepository,
)
from app.modules.user.models import User
from app.modules.user.repositories.user_repository import UserRepository


def parse_organization_id(raw: str | None) -> UUID | None:
    normalized = optional_stripped_str(raw)
    if normalized is None:
        return None
    try:
        return UUID(normalized)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid organization id") from None


async def load_user_from_bearer(
    credentials: HTTPAuthorizationCredentials | None,
    user_repo: UserRepository,
) -> User:
    token = credentials.credentials.strip() if credentials else None
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        uid = decode_access_token_from_string(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Not authenticated") from None
    user = await user_repo.get_by_id(uid)
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


async def ensure_organization_access(
    user: User,
    user_org_repo: UserOrganizationRepository,
    org_repo: OrganizationRepository,
    *,
    path_organization_id: UUID | None,
    header_org_raw: str | None,
    required: bool,
    required_org_type: OrganizationType | None = None,
) -> UUID | None:
    organization_id = path_organization_id or parse_organization_id(header_org_raw)
    if organization_id is None:
        if required:
            raise HTTPException(status_code=400, detail="Organization context required")
        return None
    if not user.is_super_admin:
        await user_org_repo.is_active_member(user.id, organization_id)
        if required_org_type is not None:
            org = await org_repo.get_by_id(organization_id)
            if org is None:
                raise HTTPException(status_code=404, detail="Organization not found")
            if org.type != required_org_type:
                raise HTTPException(status_code=403, detail="Forbidden")
    return organization_id


async def load_organization(
    org_repo: OrganizationRepository,
    organization_id: UUID,
) -> Organization:
    organization = await org_repo.get_by_id(organization_id)
    if organization is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    return organization


def assert_organization_type(
    organization: Organization,
    required_org_type: OrganizationType | None,
) -> None:
    if required_org_type is not None and organization.type != required_org_type:
        raise HTTPException(status_code=403, detail="Forbidden")
