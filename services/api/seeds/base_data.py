"""Static seed data for development database initialization."""

from __future__ import annotations

from dataclasses import dataclass

ORG_ALPHA = "Organización Alpha"
ORG_BETA = "Organización Beta"
SELLER_ALPHA = "Tienda Alpha"
SELLER_BETA = "Tienda Beta"


@dataclass(frozen=True)
class UserSeed:
    username: str
    password: str
    is_super_admin: bool
    provider_organization_names: tuple[str, ...] = ()
    seller_organization_names: tuple[str, ...] = ()


@dataclass(frozen=True)
class CategorySeed:
    name: str
    provider_organization_name: str


@dataclass(frozen=True)
class ProductSeed:
    name: str
    category_name: str
    provider_organization_name: str
    price: int


@dataclass(frozen=True)
class ProviderSellerLinkSeed:
    provider_name: str
    seller_name: str


USERS: tuple[UserSeed, ...] = (
    UserSeed("superadmin", "SuperAdmin123!", is_super_admin=True),
    UserSeed(
        "org-both",
        "User123!",
        is_super_admin=False,
        provider_organization_names=(ORG_ALPHA, ORG_BETA),
    ),
    UserSeed(
        "org-one",
        "User123!",
        is_super_admin=False,
        provider_organization_names=(ORG_ALPHA,),
    ),
    UserSeed(
        "seller-both",
        "User123!",
        is_super_admin=False,
        seller_organization_names=(SELLER_ALPHA, SELLER_BETA),
    ),
    UserSeed(
        "seller-one",
        "User123!",
        is_super_admin=False,
        seller_organization_names=(SELLER_ALPHA,),
    ),
    UserSeed("standalone-one", "User123!", is_super_admin=False),
    UserSeed("standalone-two", "User123!", is_super_admin=False),
)

PROVIDER_ORGANIZATION_NAMES: tuple[str, ...] = (ORG_ALPHA, ORG_BETA)
SELLER_ORGANIZATION_NAMES: tuple[str, ...] = (SELLER_ALPHA, SELLER_BETA)

PROVIDER_SELLER_LINKS: tuple[ProviderSellerLinkSeed, ...] = (
    ProviderSellerLinkSeed(provider_name=ORG_ALPHA, seller_name=SELLER_ALPHA),
    ProviderSellerLinkSeed(provider_name=ORG_BETA, seller_name=SELLER_BETA),
)

CATEGORIES: tuple[CategorySeed, ...] = (
    CategorySeed(name="Categoría Alpha", provider_organization_name=ORG_ALPHA),
    CategorySeed(name="Categoría Beta", provider_organization_name=ORG_BETA),
)

PRODUCTS: tuple[ProductSeed, ...] = (
    ProductSeed(
        name="Producto Alpha 1",
        category_name="Categoría Alpha",
        provider_organization_name=ORG_ALPHA,
        price=1500,
    ),
    ProductSeed(
        name="Producto Alpha 2",
        category_name="Categoría Alpha",
        provider_organization_name=ORG_ALPHA,
        price=2500,
    ),
    ProductSeed(
        name="Producto Beta 1",
        category_name="Categoría Beta",
        provider_organization_name=ORG_BETA,
        price=1800,
    ),
    ProductSeed(
        name="Producto Beta 2",
        category_name="Categoría Beta",
        provider_organization_name=ORG_BETA,
        price=3200,
    ),
)
