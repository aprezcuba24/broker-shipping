from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.organization.enums import InvitationKind, InvitationStatus


class AcceptByTokenBody(BaseModel):
    token: str = Field(min_length=1, max_length=64)
    seller_organization_id: UUID | None = None


class MemberInviteCreate(BaseModel):
    invitee_email: EmailStr


class SellerLinkInviteCreate(BaseModel):
    invitee_email: EmailStr
    counterparty_organization_id: UUID | None = None


class MemberIsActivePatch(BaseModel):
    is_active: bool


class MemberPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    organization_id: UUID
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
