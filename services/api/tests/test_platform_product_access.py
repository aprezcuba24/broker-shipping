"""Platform product entitlements on API routes."""

from __future__ import annotations

import pytest

from app.types import PlatformProductCode
from tests.factories.auth_helpers import bearer_headers

pytestmark = pytest.mark.asyncio


async def test_phone_blacklist_requires_product(
    client,
    user_factory,
    organization_factory,
) -> None:
    user = await user_factory.build()
    org = await organization_factory.build(
        user_id=user["id"],
        platform_product_codes=[PlatformProductCode.provider_management],
    )
    r = await client.get(
        "/phone-blacklist/",
        params={"organization_id": org["id"]},
        headers=bearer_headers(user_id=user["id"]),
    )
    assert r.status_code == 403
    assert r.json()["code"] == "product_not_enabled"


async def test_provider_products_without_management_product(
    client,
    user_factory,
    organization_factory,
) -> None:
    user = await user_factory.build()
    org = await organization_factory.build(
        user_id=user["id"],
        platform_product_codes=[PlatformProductCode.phone_blacklist],
    )
    r = await client.get(
        "/products/provider/",
        params={"organization_id": org["id"]},
        headers=bearer_headers(user_id=user["id"]),
    )
    assert r.status_code == 403
    assert r.json()["code"] == "product_not_enabled"


async def test_seller_aggregate_without_any_management_org(
    client,
    user_factory,
    organization_factory,
) -> None:
    user = await user_factory.build()
    await organization_factory.build_seller(
        user_id=user["id"],
        platform_product_codes=[PlatformProductCode.phone_blacklist],
    )
    r = await client.get(
        "/products/seller/",
        headers=bearer_headers(user_id=user["id"]),
    )
    assert r.status_code == 403
    assert r.json()["code"] == "product_not_enabled"


async def test_super_admin_put_replaces_org_products(
    client,
    user_factory,
    organization_factory,
) -> None:
    admin = await user_factory.build(is_super_admin=True)
    user = await user_factory.build()
    org = await organization_factory.build(user_id=user["id"])

    r = await client.put(
        f"/organizations/{org['id']}/platform-products",
        json={"codes": ["phone_blacklist"]},
        headers=bearer_headers(user_id=admin["id"]),
    )
    assert r.status_code == 200
    enabled = {row["code"]: row["enabled"] for row in r.json()}
    assert enabled["phone_blacklist"] is True
    assert enabled["provider_management"] is False

    r2 = await client.get(
        "/products/provider/",
        params={"organization_id": org["id"]},
        headers=bearer_headers(user_id=user["id"]),
    )
    assert r2.status_code == 403
    assert r2.json()["code"] == "product_not_enabled"


async def test_list_organization_platform_products_as_member(
    client,
    user_factory,
    organization_factory,
) -> None:
    user = await user_factory.build()
    org = await organization_factory.build(user_id=user["id"])
    r = await client.get(
        f"/organizations/{org['id']}/platform-products",
        headers=bearer_headers(user_id=user["id"]),
    )
    assert r.status_code == 200
    enabled = {row["code"]: row["enabled"] for row in r.json()}
    assert enabled["phone_blacklist"] is True
    assert enabled["provider_management"] is True
    assert enabled["facebook_publishing"] is False
