from sqlmodel import SQLModel

from app.models.organization.enums import (
    InvitationKind,
    InvitationStatus,
    OrganizationType,
)
from app.models.organization.organization import Organization
from app.models.organization.organization_invitation import OrganizationInvitation
from app.models.organization.provider_seller_link import ProviderSellerLink
from app.models.organization.user_organization import UserOrganization

DOMAIN_MODELS: tuple[type[SQLModel], ...] = (
    Organization,
    UserOrganization,
    ProviderSellerLink,
    OrganizationInvitation,
)

__all__ = [
    "DOMAIN_MODELS",
    "InvitationKind",
    "InvitationStatus",
    "Organization",
    "OrganizationInvitation",
    "OrganizationType",
    "ProviderSellerLink",
    "UserOrganization",
]
