from sqlmodel import SQLModel

from app.modules.organization.models.api_key import ApiKey, ApiKeyPublic
from app.modules.organization.models.enums import (
    InvitationKind,
    InvitationStatus,
    OrgMemberRole,
)
from app.modules.organization.models.organization import Organization
from app.modules.organization.models.organization_invitation import (
    AcceptByTokenBody,
    CreateInviteBody,
    InvitationCreatedResponse,
    InvitationPublic,
    MemberIsActivePatch,
    MemberPublic,
    OrganizationInvitation,
)
from app.modules.organization.models.user_organization import UserOrganization

MODULE_MODELS: tuple[type[SQLModel], ...] = (
    Organization,
    UserOrganization,
    ApiKey,
    OrganizationInvitation,
)

__all__ = [
    "MODULE_MODELS",
    "AcceptByTokenBody",
    "ApiKey",
    "ApiKeyPublic",
    "CreateInviteBody",
    "InvitationCreatedResponse",
    "InvitationKind",
    "InvitationPublic",
    "InvitationStatus",
    "MemberIsActivePatch",
    "MemberPublic",
    "OrgMemberRole",
    "Organization",
    "OrganizationInvitation",
    "UserOrganization",
]
