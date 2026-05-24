from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict


class UserPrincipal(BaseModel):
    model_config = ConfigDict(frozen=True)

    user_id: UUID
    username: str
    organization_id: UUID | None = None


class ApiKeyPrincipal(BaseModel):
    model_config = ConfigDict(frozen=True)

    api_key_id: UUID
    organization_id: UUID


Principal = UserPrincipal | ApiKeyPrincipal


def organization_id_for(principal: Principal) -> UUID:
    match principal:
        case ApiKeyPrincipal(organization_id=oid):
            return oid
        case UserPrincipal(organization_id=oid) if oid is not None:
            return oid
        case _:
            raise HTTPException(status_code=400, detail="Organization context required")
