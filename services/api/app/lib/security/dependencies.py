from __future__ import annotations

from typing import Annotated
from uuid import UUID

from dishka import FromDishka
from dishka.integrations.fastapi import inject
from fastapi import Depends, HTTPException
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer

from app.lib.headers import optional_stripped_str
from app.lib.security.api_keys import split_raw
from app.lib.security.tokens import decode_access_token_from_string
from app.modules.organization.models import Organization, OrganizationType
from app.modules.organization.repositories.organization_repository import OrganizationRepository
from app.modules.organization.repositories.user_organization_repository import (
    UserOrganizationRepository,
)
from app.modules.organization.services.api_key_service import ApiKeyService
from app.modules.user.models import User
from app.modules.user.repositories.user_repository import UserRepository

# Shared scheme instances so OpenAPI `components.securitySchemes` stays stable + named.
broker_bearer = HTTPBearer(auto_error=False, scheme_name="BrokerBearer")
broker_api_key = APIKeyHeader(
    name="X-API-Key",
    auto_error=False,
    scheme_name="BrokerApiKey",
)
broker_organization = APIKeyHeader(
    name="X-Organization-Id",
    auto_error=False,
    scheme_name="BrokerOrganization",
)


def _parse_organization_id(raw: str | None) -> UUID | None:
    normalized = optional_stripped_str(raw)
    if normalized is None:
        return None
    try:
        return UUID(normalized)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid organization id") from None


async def _ensure_organization_access(
    user: User,
    user_org_repo: UserOrganizationRepository,
    org_repo: OrganizationRepository,
    *,
    path_organization_id: UUID | None,
    header_org_raw: str | None,
    required: bool,
    required_org_type: OrganizationType | None = None,
) -> UUID | None:
    organization_id = path_organization_id or _parse_organization_id(header_org_raw)
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


async def _load_organization(
    org_repo: OrganizationRepository,
    organization_id: UUID,
) -> Organization:
    organization = await org_repo.get_by_id(organization_id)
    if organization is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    return organization


def make_resolve_user(
    *,
    required_org_type: OrganizationType | None = None,
    check_path_membership: bool = True,
):
    @inject
    async def _resolve(
        credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(broker_bearer)],
        org_id: Annotated[str | None, Depends(broker_organization)],
        user_repo: FromDishka[UserRepository],
        user_org_repo: FromDishka[UserOrganizationRepository],
        org_repo: FromDishka[OrganizationRepository],
        organization_id: UUID | None = None,
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

        path_org = organization_id if check_path_membership else None
        needs_org_context = (
            path_org is not None or org_id is not None or required_org_type is not None
        )
        await _ensure_organization_access(
            user,
            user_org_repo,
            org_repo,
            path_organization_id=path_org,
            header_org_raw=org_id,
            required=needs_org_context,
            required_org_type=required_org_type,
        )
        return user

    return _resolve


_resolve_user = make_resolve_user()


@inject
async def _resolve_api_key(
    raw_key: Annotated[str | None, Depends(broker_api_key)],
    api_key_service: FromDishka[ApiKeyService],
    org_repo: FromDishka[OrganizationRepository],
) -> Organization:
    if not raw_key:
        raise HTTPException(status_code=401, detail="API key required")
    key = await api_key_service.verify_raw(raw_key)
    if key is None:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return await _load_organization(org_repo, UUID(str(key.organization_id)))


def make_resolve_user_or_api_key(*, required_org_type: OrganizationType | None = None):
    @inject
    async def _resolve(
        credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(broker_bearer)],
        raw_key: Annotated[str | None, Depends(broker_api_key)],
        org_id: Annotated[str | None, Depends(broker_organization)],
        user_repo: FromDishka[UserRepository],
        user_org_repo: FromDishka[UserOrganizationRepository],
        api_key_service: FromDishka[ApiKeyService],
        org_repo: FromDishka[OrganizationRepository],
    ) -> Organization:
        token = credentials.credentials.strip() if credentials else None
        if token:
            try:
                uid = decode_access_token_from_string(token)
            except ValueError:
                uid = None
            if uid is not None:
                user = await user_repo.get_by_id(uid)
                if user is not None:
                    organization_id = await _ensure_organization_access(
                        user,
                        user_org_repo,
                        org_repo,
                        path_organization_id=None,
                        header_org_raw=org_id,
                        required=True,
                        required_org_type=required_org_type,
                    )
                    assert organization_id is not None
                    return await _load_organization(org_repo, organization_id)
        if raw_key and split_raw(raw_key) is not None:
            key = await api_key_service.verify_raw(raw_key)
            if key is not None:
                organization = await _load_organization(
                    org_repo,
                    UUID(str(key.organization_id)),
                )
                if required_org_type is not None and organization.type != required_org_type:
                    raise HTTPException(status_code=403, detail="Forbidden")
                return organization
        raise HTTPException(status_code=401, detail="Not authenticated")

    return _resolve


_resolve_user_or_api_key = make_resolve_user_or_api_key()
