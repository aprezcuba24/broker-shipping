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


async def test_update_profile_rejects_duplicate_phone(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    first = await user_factory.build()
    second = await user_factory.build()
    first_headers = bearer_headers(user_id=first["id"])
    second_headers = bearer_headers(user_id=second["id"])

    r1 = await client.patch(
        "/users/me",
        headers=first_headers,
        json={"phone": "55512345"},
    )
    assert r1.status_code == 200
    assert r1.json()["phone"] == "5355512345"

    r2 = await client.patch(
        "/users/me",
        headers=second_headers,
        json={"phone": "55512345"},
    )
    assert r2.status_code == 409
    assert r2.json()["code"] == "user_phone_conflict"


async def test_update_profile_allows_same_phone_for_owner(
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
        json={"phone": "55512345"},
    )
    assert r.status_code == 200
    assert r.json()["phone"] == "5355512345"


async def test_update_profile_allows_multiple_null_phones(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    first = await user_factory.build()
    second = await user_factory.build()

    r1 = await client.get(
        "/users/me",
        headers=bearer_headers(user_id=first["id"]),
    )
    r2 = await client.get(
        "/users/me",
        headers=bearer_headers(user_id=second["id"]),
    )
    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.json()["phone"] is None
    assert r2.json()["phone"] is None


async def test_update_profile_phone_can_be_reassigned_after_clear(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    first = await user_factory.build()
    second = await user_factory.build()
    first_headers = bearer_headers(user_id=first["id"])
    second_headers = bearer_headers(user_id=second["id"])

    await client.patch(
        "/users/me",
        headers=first_headers,
        json={"phone": "55512345"},
    )
    cleared = await client.patch(
        "/users/me",
        headers=first_headers,
        json={"phone": None},
    )
    assert cleared.status_code == 200
    assert cleared.json()["phone"] is None

    taken = await client.patch(
        "/users/me",
        headers=second_headers,
        json={"phone": "55512345"},
    )
    assert taken.status_code == 200
    assert taken.json()["phone"] == "5355512345"
