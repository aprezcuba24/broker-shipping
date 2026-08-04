from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.organization.enums import InvitationKind, InvitationStatus
from app.schemas.fields import NonEmptyStr, NormalizedEmail


class AcceptByTokenBody(BaseModel):
    token: NonEmptyStr = Field(max_length=64)


class MemberInviteCreate(BaseModel):
    invitee_email: NormalizedEmail


class MemberIsActivePatch(BaseModel):
    is_active: bool


class MemberPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    organization_id: UUID
    name: str
    email: EmailStr
    is_active: bool
    joined_at: datetime


class InvitationPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    counterparty_organization_id: UUID | None
    kind: InvitationKind
    status: InvitationStatus
    invitee_email: str | None
    user_id: UUID | None
    created_by_user_id: UUID
    created_at: datetime


class InvitationCreatedResponse(InvitationPublic):
    """Token invite creation response; token is always set for email invites."""

    token: str | None = None
