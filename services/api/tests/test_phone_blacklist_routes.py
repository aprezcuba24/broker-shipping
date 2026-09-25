import pytest
import pytest_asyncio
from httpx import AsyncClient

from tests.factories.auth_helpers import bearer_headers
from tests.factories.organization_factory import OrganizationFactory
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


@pytest_asyncio.fixture
async def blacklist_ctx(
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> dict:
    seller_user = await user_factory.build()
    other_seller_user = await user_factory.build()
    provider_user = await user_factory.build()
    outsider = await user_factory.build()

    seller_org = await organization_factory.build_seller(user_id=seller_user["id"])
    other_seller_org = await organization_factory.build_seller(
        user_id=other_seller_user["id"],
    )
    provider_org = await organization_factory.build(user_id=provider_user["id"])

    return {
        "seller_user_id": seller_user["id"],
        "seller_org_id": seller_org["id"],
        "other_seller_user_id": other_seller_user["id"],
        "other_seller_org_id": other_seller_org["id"],
        "provider_user_id": provider_user["id"],
        "provider_org_id": provider_org["id"],
        "outsider_bearer": bearer_headers(user_id=outsider["id"]),
        "seller_bearer": bearer_headers(user_id=seller_user["id"]),
        "other_seller_bearer": bearer_headers(user_id=other_seller_user["id"]),
        "provider_bearer": bearer_headers(user_id=provider_user["id"]),
        "seller_params": {"organization_id": seller_org["id"]},
        "other_seller_params": {"organization_id": other_seller_org["id"]},
        "provider_params": {"organization_id": provider_org["id"]},
    }


async def test_status_starts_as_no(
    client: AsyncClient,
    blacklist_ctx: dict,
) -> None:
    response = await client.get(
        "/phone-blacklist/status",
        params={**blacklist_ctx["seller_params"], "phone": "51234567"},
        headers=blacklist_ctx["seller_bearer"],
    )
    assert response.status_code == 200
    body = response.json()
    assert body["phone"] == "5351234567"
    assert body["status"] == "no"
    assert body["own_entry_id"] is None
    assert body["other_count"] == 0


async def test_add_and_status_yes(
    client: AsyncClient,
    blacklist_ctx: dict,
) -> None:
    created = await client.post(
        "/phone-blacklist/",
        params=blacklist_ctx["seller_params"],
        headers=blacklist_ctx["seller_bearer"],
        json={"phone": "51234567", "reason": "fraud"},
    )
    assert created.status_code == 201
    entry = created.json()
    assert entry["phone"] == "5351234567"
    assert entry["reason"] == "fraud"
    assert entry["organization_id"] == blacklist_ctx["seller_org_id"]
    assert entry["withdrawn_at"] is None

    status = await client.get(
        "/phone-blacklist/status",
        params={**blacklist_ctx["seller_params"], "phone": "51234567"},
        headers=blacklist_ctx["seller_bearer"],
    )
    assert status.status_code == 200
    body = status.json()
    assert body["status"] == "yes"
    assert body["own_entry_id"] == entry["id"]
    assert body["other_count"] == 0


async def test_other_org_sees_reported(
    client: AsyncClient,
    blacklist_ctx: dict,
) -> None:
    await client.post(
        "/phone-blacklist/",
        params=blacklist_ctx["seller_params"],
        headers=blacklist_ctx["seller_bearer"],
        json={"phone": "55511122", "reason": "nonpayment"},
    )

    status = await client.get(
        "/phone-blacklist/status",
        params={**blacklist_ctx["other_seller_params"], "phone": "55511122"},
        headers=blacklist_ctx["other_seller_bearer"],
    )
    assert status.status_code == 200
    body = status.json()
    assert body["status"] == "reported"
    assert body["own_entry_id"] is None
    assert body["other_count"] == 1


async def test_withdraw_only_removes_own_entry(
    client: AsyncClient,
    blacklist_ctx: dict,
) -> None:
    await client.post(
        "/phone-blacklist/",
        params=blacklist_ctx["seller_params"],
        headers=blacklist_ctx["seller_bearer"],
        json={"phone": "55533344", "reason": "abuse"},
    )
    await client.post(
        "/phone-blacklist/",
        params=blacklist_ctx["other_seller_params"],
        headers=blacklist_ctx["other_seller_bearer"],
        json={"phone": "55533344", "reason": "fraud"},
    )

    withdrawn = await client.delete(
        "/phone-blacklist/",
        params={**blacklist_ctx["seller_params"], "phone": "55533344"},
        headers=blacklist_ctx["seller_bearer"],
    )
    assert withdrawn.status_code == 204

    own_status = await client.get(
        "/phone-blacklist/status",
        params={**blacklist_ctx["seller_params"], "phone": "55533344"},
        headers=blacklist_ctx["seller_bearer"],
    )
    assert own_status.json()["status"] == "reported"
    assert own_status.json()["other_count"] == 1

    other_status = await client.get(
        "/phone-blacklist/status",
        params={**blacklist_ctx["other_seller_params"], "phone": "55533344"},
        headers=blacklist_ctx["other_seller_bearer"],
    )
    assert other_status.json()["status"] == "yes"


async def test_provider_can_add(
    client: AsyncClient,
    blacklist_ctx: dict,
) -> None:
    created = await client.post(
        "/phone-blacklist/",
        params=blacklist_ctx["provider_params"],
        headers=blacklist_ctx["provider_bearer"],
        json={"phone": "55599900", "reason": "other", "note": "Comunidad"},
    )
    assert created.status_code == 201
    assert created.json()["organization_id"] == blacklist_ctx["provider_org_id"]


async def test_other_reason_requires_note(
    client: AsyncClient,
    blacklist_ctx: dict,
) -> None:
    response = await client.post(
        "/phone-blacklist/",
        params=blacklist_ctx["seller_params"],
        headers=blacklist_ctx["seller_bearer"],
        json={"phone": "55588877", "reason": "other"},
    )
    assert response.status_code == 422


async def test_duplicate_active_conflicts(
    client: AsyncClient,
    blacklist_ctx: dict,
) -> None:
    payload = {"phone": "55566655", "reason": "fraud"}
    first = await client.post(
        "/phone-blacklist/",
        params=blacklist_ctx["seller_params"],
        headers=blacklist_ctx["seller_bearer"],
        json=payload,
    )
    assert first.status_code == 201

    second = await client.post(
        "/phone-blacklist/",
        params=blacklist_ctx["seller_params"],
        headers=blacklist_ctx["seller_bearer"],
        json=payload,
    )
    assert second.status_code == 409


async def test_can_readd_after_withdraw(
    client: AsyncClient,
    blacklist_ctx: dict,
) -> None:
    phone = "55544433"
    first = await client.post(
        "/phone-blacklist/",
        params=blacklist_ctx["seller_params"],
        headers=blacklist_ctx["seller_bearer"],
        json={"phone": phone, "reason": "fraud"},
    )
    assert first.status_code == 201

    await client.delete(
        "/phone-blacklist/",
        params={**blacklist_ctx["seller_params"], "phone": phone},
        headers=blacklist_ctx["seller_bearer"],
    )

    second = await client.post(
        "/phone-blacklist/",
        params=blacklist_ctx["seller_params"],
        headers=blacklist_ctx["seller_bearer"],
        json={"phone": phone, "reason": "abuse"},
    )
    assert second.status_code == 201
    assert second.json()["id"] != first.json()["id"]


async def test_non_member_forbidden(
    client: AsyncClient,
    blacklist_ctx: dict,
) -> None:
    response = await client.post(
        "/phone-blacklist/",
        params=blacklist_ctx["seller_params"],
        headers=blacklist_ctx["outsider_bearer"],
        json={"phone": "55522211", "reason": "fraud"},
    )
    assert response.status_code == 403


async def test_missing_organization_id(
    client: AsyncClient,
    blacklist_ctx: dict,
) -> None:
    response = await client.get(
        "/phone-blacklist/status",
        params={"phone": "51234567"},
        headers=blacklist_ctx["seller_bearer"],
    )
    assert response.status_code == 422


async def test_withdraw_missing_is_not_found(
    client: AsyncClient,
    blacklist_ctx: dict,
) -> None:
    response = await client.delete(
        "/phone-blacklist/",
        params={**blacklist_ctx["seller_params"], "phone": "51112233"},
        headers=blacklist_ctx["seller_bearer"],
    )
    assert response.status_code == 404
