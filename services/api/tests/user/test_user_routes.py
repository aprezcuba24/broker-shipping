import pytest
from httpx import AsyncClient

from tests.factories.auth_helpers import bearer_headers
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def test_signup_and_login_flow(client: AsyncClient, user_factory: UserFactory) -> None:
    r = await client.post("/users/", json={"username": "alice", "password": "x"})
    assert r.status_code == 201
    body = r.json()
    assert body["username"] == "alice"

    r_bad = await client.post("/users/login", json={"username": "alice", "password": "wrong"})
    assert r_bad.status_code == 401

    r_ok = await client.post("/users/login", json={"username": "alice", "password": "x"})
    assert r_ok.status_code == 200
    token = r_ok.json()["access_token"]
    assert token

    r_me = await client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
    assert r_me.status_code == 200
    assert r_me.json()["username"] == "alice"


async def test_me_requires_auth(client: AsyncClient) -> None:
    r = await client.get("/users/me")
    assert r.status_code == 401


async def test_bearer_headers_helper_matches_login(user_factory: UserFactory) -> None:
    u = await user_factory.build(username="bob", password="pw")
    hdrs = bearer_headers(user_id=u["id"])
    assert hdrs["Authorization"].startswith("Bearer ")
