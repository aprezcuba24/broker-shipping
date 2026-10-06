from datetime import datetime, timedelta, timezone

import jwt
import pytest
from httpx import AsyncClient

from app.config import settings
from tests.factories.auth_helpers import bearer_headers
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")

_YEAR_MINUTES = 60 * 24 * 365


def _token_exp(token: str) -> datetime:
    payload = jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
    )
    return datetime.fromtimestamp(payload["exp"], tz=timezone.utc)


async def test_login_token_expires_in_about_one_year(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    user = await user_factory.build(password="secret123")
    login = await client.post(
        "/users/login",
        json={"email": user["email"], "password": "secret123"},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]

    exp = _token_exp(token)
    expected = datetime.now(timezone.utc) + timedelta(minutes=_YEAR_MINUTES)
    assert abs((exp - expected).total_seconds()) < 120


async def test_refresh_returns_new_access_token(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    user = await user_factory.build()
    headers = bearer_headers(user_id=user["id"])

    refresh = await client.post("/users/refresh", headers=headers)
    assert refresh.status_code == 200
    new_token = refresh.json()["access_token"]
    assert new_token

    me = await client.get(
        "/users/me",
        headers={"Authorization": f"Bearer {new_token}"},
    )
    assert me.status_code == 200
    assert me.json()["id"] == str(user["id"])

    exp = _token_exp(new_token)
    expected = datetime.now(timezone.utc) + timedelta(minutes=_YEAR_MINUTES)
    assert abs((exp - expected).total_seconds()) < 120


async def test_refresh_requires_auth(client: AsyncClient) -> None:
    r = await client.post("/users/refresh")
    assert r.status_code == 401
