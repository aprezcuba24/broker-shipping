"""FastAPI auth dependencies (``Depends``)."""

from __future__ import annotations

from collections.abc import Callable
from typing import Annotated
from uuid import UUID

from dishka import FromDishka
from dishka.integrations.fastapi import inject
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.lib.security.access import (
    assert_organization_type,
    ensure_organization_access,
    load_organization,
    load_user_from_bearer,
    parse_organization_id,
)
from app.lib.security.api_keys import split_raw
from app.lib.security.schemes import broker_api_key, broker_bearer, broker_organization
from app.lib.security.tokens import decode_access_token_from_string
from app.modules.organization.models import ApiKey, Organization, OrganizationType
from app.modules.organization.repositories.organization_repository import OrganizationRepository
from app.modules.organization.repositories.user_organization_repository import (
    UserOrganizationRepository,
)
from app.modules.organization.services.api_key_service import ApiKeyService
from app.modules.user.models import User
from app.modules.user.repositories.user_repository import UserRepository

_JWT_ONLY_DETAIL = "JWT user required; use get_tenant or get_api_key"


async def _verify_api_key_raw(
    raw_key: str | None,
    api_key_service: ApiKeyService,
) -> ApiKey:
    if not raw_key:
        raise HTTPException(status_code=401, detail="API key required")
    key = await api_key_service.verify_raw(raw_key)
    if key is None:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return key


@inject
async def get_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(broker_bearer)],
    raw_key: Annotated[str | None, Depends(broker_api_key)],
    org_id: Annotated[str | None, Depends(broker_organization)],
    user_repo: FromDishka[UserRepository],
    user_org_repo: FromDishka[UserOrganizationRepository],
    org_repo: FromDishka[OrganizationRepository],
) -> User:
    if raw_key and split_raw(raw_key) is not None:
        raise HTTPException(status_code=500, detail=_JWT_ONLY_DETAIL)
    user = await load_user_from_bearer(credentials, user_repo)
    header_org = parse_organization_id(org_id)
    if header_org is not None:
        await ensure_organization_access(
            user,
            user_org_repo,
            org_repo,
            path_organization_id=None,
            header_org_raw=org_id,
            required=True,
            required_org_type=None,
        )
    return user


@inject
async def get_api_key(
    raw_key: Annotated[str | None, Depends(broker_api_key)],
    api_key_service: FromDishka[ApiKeyService],
) -> ApiKey:
    return await _verify_api_key_raw(raw_key, api_key_service)


def get_organization(
    org_type: OrganizationType | None = None,
    *,
    path: bool = True,
    required: bool = True,
) -> Callable[..., Organization | None]:
    @inject
    async def _resolve(
        user: Annotated[User, Depends(get_user)],
        org_id: Annotated[str | None, Depends(broker_organization)],
        org_repo: FromDishka[OrganizationRepository],
        user_org_repo: FromDishka[UserOrganizationRepository],
        organization_id: UUID | None = None,
    ) -> Organization | None:
        path_org = organization_id if path else None
        header_org = parse_organization_id(org_id)
        if path_org is None and header_org is None:
            if org_type is not None and required:
                resolved_id = await ensure_organization_access(
                    user,
                    user_org_repo,
                    org_repo,
                    path_organization_id=None,
                    header_org_raw=org_id,
                    required=True,
                    required_org_type=org_type,
                )
            else:
                return None
        else:
            resolved_id = await ensure_organization_access(
                user,
                user_org_repo,
                org_repo,
                path_organization_id=path_org,
                header_org_raw=org_id,
                required=True,
                required_org_type=org_type,
            )
        if resolved_id is None:
            return None
        return await load_organization(org_repo, resolved_id)

    return _resolve


def get_tenant(
    org_type: OrganizationType | None = None,
) -> Callable[..., Organization]:
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
                    organization_id = await ensure_organization_access(
                        user,
                        user_org_repo,
                        org_repo,
                        path_organization_id=None,
                        header_org_raw=org_id,
                        required=True,
                        required_org_type=org_type,
                    )
                    assert organization_id is not None
                    return await load_organization(org_repo, organization_id)
        if raw_key and split_raw(raw_key) is not None:
            key = await _verify_api_key_raw(raw_key, api_key_service)
            organization = await load_organization(
                org_repo,
                UUID(str(key.organization_id)),
            )
            assert_organization_type(organization, org_type)
            return organization
        raise HTTPException(status_code=401, detail="Not authenticated")

    return _resolve


UserDep = Annotated[User, Depends(get_user)]

require_user = get_user
require_organization = get_organization
