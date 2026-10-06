from sqlmodel import SQLModel

from app.models.platform.organization_platform_product import OrganizationPlatformProduct
from app.models.platform.platform_product import PlatformProduct

DOMAIN_MODELS: tuple[type[SQLModel], ...] = (
    PlatformProduct,
    OrganizationPlatformProduct,
)

__all__ = [
    "DOMAIN_MODELS",
    "OrganizationPlatformProduct",
    "PlatformProduct",
]
