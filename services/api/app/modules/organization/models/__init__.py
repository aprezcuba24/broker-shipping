from sqlmodel import SQLModel

from app.modules.organization.models.api_key import ApiKey, ApiKeyPublic
from app.modules.organization.models.enums import (
    InvitationKind,
    InvitationStatus,
    OrganizationType,
)
from app.modules.organization.models.organization import Organization
from app.modules.organization.models.organization_invitation import (
    AcceptByTokenBody,
    InvitationCreatedResponse,
    InvitationPublic,
    MemberIsActivePatch,
    MemberPublic,
    OrganizationInvitation,
)
from app.modules.organization.models.provider_seller_link import ProviderSellerLink
from app.modules.organization.models.user_organization import UserOrganization

MODULE_MODELS: tuple[type[SQLModel], ...] = (
    Organization,
    UserOrganization,
    ApiKey,
    OrganizationInvitation,
    ProviderSellerLink,
)

__all__ = [
    "MODULE_MODELS",
    "AcceptByTokenBody",
    "ApiKey",
    "ApiKeyPublic",
    "InvitationCreatedResponse",
    "InvitationKind",
    "InvitationPublic",
    "InvitationStatus",
    "MemberIsActivePatch",
    "MemberPublic",
    "Organization",
    "OrganizationInvitation",
    "OrganizationType",
    "ProviderSellerLink",
    "UserOrganization",
]
