from __future__ import annotations

from typing import ClassVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, Enum as SAEnum, ForeignKey
from sqlmodel import Field

from app.lib.persistence import EntityModel
from app.modules.organization.models.enums import InvitationKind, InvitationStatus


class OrganizationInvitation(EntityModel, table=True):
    __tablename__ = "organization_invitation"

    IMMUTABLE_FIELDS: ClassVar[frozenset[str]] = frozenset(
        {
            "id",
            "organization_id",
            "kind",
            "token",
            "user_id",
            "created_by_user_id",
            "created_at",
            "updated_at",
        },
    )

    organization_id: UUID = Field(
        sa_column=Column(ForeignKey("organization.id", ondelete="CASCADE"), nullable=False),
    )
    kind: InvitationKind = Field(
        sa_column=Column(
            SAEnum(InvitationKind, values_callable=lambda x: [e.value for e in x]),
            nullable=False,
        ),
    )
    status: InvitationStatus = Field(
        default=InvitationStatus.pending,
        sa_column=Column(
            SAEnum(InvitationStatus, values_callable=lambda x: [e.value for e in x]),
            nullable=False,
        ),
    )
    token: str | None = Field(default=None, max_length=64, unique=True, index=True)
    user_id: UUID | None = Field(default=None, foreign_key="user.id")
    created_by_user_id: UUID = Field(foreign_key="user.id")


class AcceptByTokenBody(BaseModel):
    token: str = Field(min_length=1, max_length=64)


class MemberIsActivePatch(BaseModel):
    is_active: bool


class MemberPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    organization_id: UUID
    is_active: bool
    joined_at: object


class InvitationPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    kind: InvitationKind
    status: InvitationStatus
    token: str | None
    user_id: UUID | None
    created_by_user_id: UUID
    created_at: object


class InvitationCreatedResponse(InvitationPublic):
    """Token invite creation response; token is always set."""
