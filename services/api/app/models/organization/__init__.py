from sqlmodel import SQLModel

from app.models.organization.enums import OrganizationType
from app.models.organization.organization import Organization
from app.models.organization.provider_seller_link import ProviderSellerLink
from app.models.organization.user_organization import UserOrganization

DOMAIN_MODELS: tuple[type[SQLModel], ...] = (
    Organization,
    UserOrganization,
    ProviderSellerLink,
)

__all__ = [
    "DOMAIN_MODELS",
    "Organization",
    "OrganizationType",
    "ProviderSellerLink",
    "UserOrganization",
]
