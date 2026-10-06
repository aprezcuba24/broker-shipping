from enum import StrEnum
from typing import Literal

ClientApp = Literal["backoffice", "seller"]
DashboardPeriod = Literal["7d", "30d", "90d", "all"]
PurchaseTier = Literal[0, 1, 5, 10]
PhoneBlacklistStatus = Literal["no", "reported", "yes"]


class PlatformProductCode(StrEnum):
    phone_blacklist = "phone_blacklist"
    provider_management = "provider_management"
    facebook_publishing = "facebook_publishing"


DEFAULT_PLATFORM_PRODUCT_CODES: tuple[PlatformProductCode, ...] = (
    PlatformProductCode.phone_blacklist,
)

# Codes a non-admin client may request when creating an organization.
SELF_SERVICE_PLATFORM_PRODUCT_CODES: frozenset[PlatformProductCode] = frozenset(
    {
        PlatformProductCode.phone_blacklist,
    }
)

PLATFORM_PRODUCT_DISPLAY_NAMES: dict[PlatformProductCode, str] = {
    PlatformProductCode.phone_blacklist: "Lista negra",
    PlatformProductCode.provider_management: "Gestión de productos de proveedores",
    PlatformProductCode.facebook_publishing: "Publicación en Facebook",
}
