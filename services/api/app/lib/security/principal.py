from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, ConfigDict


class UserPrincipal(BaseModel):
    model_config = ConfigDict(frozen=True)

    user_id: UUID
    username: str


class ApiKeyPrincipal(BaseModel):
    model_config = ConfigDict(frozen=True)

    api_key_id: UUID
    organization_id: UUID


Principal = UserPrincipal | ApiKeyPrincipal
