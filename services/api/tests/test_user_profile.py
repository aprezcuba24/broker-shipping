import pytest
from httpx import AsyncClient

from tests.factories.auth_helpers import bearer_headers
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def test_update_profile_requires_auth(client: AsyncClient) -> None:
    r = await client.patch("/users/me", json={"phone": "55512345"})
    assert r.status_code == 401


async def test_update_profile_normalizes_phone(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    user = await user_factory.build()
    headers = bearer_headers(user_id=user["id"])

    r = await client.patch(
        "/users/me",
        headers=headers,
        json={"phone": "55512345"},
    )
    assert r.status_code == 200
    assert r.json()["phone"] == "5355512345"

    r_me = await client.get("/users/me", headers=headers)
    assert r_me.status_code == 200
    assert r_me.json()["phone"] == "5355512345"


async def test_update_profile_clears_phone(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    user = await user_factory.build()
    headers = bearer_headers(user_id=user["id"])

    await client.patch(
        "/users/me",
        headers=headers,
        json={"phone": "55512345"},
    )

    r = await client.patch(
        "/users/me",
        headers=headers,
        json={"phone": ""},
    )
    assert r.status_code == 200
    assert r.json()["phone"] is None

    r_null = await client.patch(
        "/users/me",
        headers=headers,
        json={"phone": "55512345"},
    )
    assert r_null.status_code == 200

    r_clear = await client.patch(
        "/users/me",
        headers=headers,
        json={"phone": None},
    )
    assert r_clear.status_code == 200
    assert r_clear.json()["phone"] is None


async def test_update_profile_rejects_invalid_phone(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    user = await user_factory.build()
    headers = bearer_headers(user_id=user["id"])

    r = await client.patch(
        "/users/me",
        headers=headers,
        json={"phone": "abcdef"},
    )
    assert r.status_code == 422


async def test_me_includes_phone_null_by_default(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    user = await user_factory.build()
    r = await client.get("/users/me", headers=bearer_headers(user_id=user["id"]))
    assert r.status_code == 200
    assert r.json()["phone"] is None
