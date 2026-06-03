import pytest
from httpx import AsyncClient

from app.modules.organization.models import OrganizationType
from tests.factories.auth_helpers import bearer_headers, login_headers
from tests.factories.organization_factory import OrganizationFactory
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def test_signup_and_login_flow(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    r = await client.post("/users/", json={"username": "alice", "password": "x"})
    assert r.status_code == 201
    body = r.json()
    assert body["username"] == "alice"
    user_id = body["id"]

    r_bad = await client.post(
        "/users/login",
        json={"username": "alice", "password": "wrong"},
        headers=login_headers(app_type="provider_app"),
    )
    assert r_bad.status_code == 401

    r_no_header = await client.post(
        "/users/login",
        json={"username": "alice", "password": "x"},
    )
    assert r_no_header.status_code == 401

    r_no_org = await client.post(
        "/users/login",
        json={"username": "alice", "password": "x"},
        headers=login_headers(app_type="provider_app"),
    )
    assert r_no_org.status_code == 401

    await organization_factory.build(user_id=user_id)

    r_ok = await client.post(
        "/users/login",
        json={"username": "alice", "password": "x"},
        headers=login_headers(app_type="provider_app"),
    )
    assert r_ok.status_code == 200
    token = r_ok.json()["access_token"]
    assert token

    r_me = await client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
    assert r_me.status_code == 200
    assert r_me.json()["username"] == "alice"


async def test_login_provider_app_requires_provider_org(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    u = await user_factory.build(username="provider_only", password="pw")
    await organization_factory.build(user_id=u["id"], org_type=OrganizationType.provider)

    r = await client.post(
        "/users/login",
        json={"username": "provider_only", "password": "pw"},
        headers=login_headers(app_type="provider_app"),
    )
    assert r.status_code == 200


async def test_login_provider_app_rejected_without_provider_org(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    await user_factory.build(username="lonely", password="pw")

    r = await client.post(
        "/users/login",
        json={"username": "lonely", "password": "pw"},
        headers=login_headers(app_type="provider_app"),
    )
    assert r.status_code == 401


async def test_login_seller_app_with_seller_org(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    u = await user_factory.build(username="seller_user", password="pw")
    await organization_factory.build_seller(user_id=u["id"])

    r = await client.post(
        "/users/login",
        json={"username": "seller_user", "password": "pw"},
        headers=login_headers(app_type="seller_app"),
    )
    assert r.status_code == 200


async def test_login_seller_app_rejected_with_only_provider_org(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    u = await user_factory.build(username="provider_not_seller", password="pw")
    await organization_factory.build(user_id=u["id"], org_type=OrganizationType.provider)

    r = await client.post(
        "/users/login",
        json={"username": "provider_not_seller", "password": "pw"},
        headers=login_headers(app_type="seller_app"),
    )
    assert r.status_code == 401


async def test_me_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/users/me")
    assert r.status_code == 401


async def test_bearer_headers_helper_matches_login(
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    u = await user_factory.build(username="bob", password="pw")
    await organization_factory.build(user_id=u["id"])
    hdrs = bearer_headers(user_id=u["id"])
    assert hdrs["Authorization"].startswith("Bearer ")
