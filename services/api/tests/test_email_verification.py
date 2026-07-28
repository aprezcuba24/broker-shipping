from __future__ import annotations

from datetime import timedelta

import pytest
from httpx import AsyncClient
from sqlmodel import select

from app.lib.utils import utc_now
from app.main import app
from app.models.user.user import User
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


@pytest.fixture
def mock_send_email(monkeypatch: pytest.MonkeyPatch) -> list[dict[str, str]]:
    sent: list[dict[str, str]] = []

    async def _fake_send(*, to: str, name: str, verify_url: str) -> None:
        sent.append({"to": to, "name": name, "verify_url": verify_url})

    async def _emit_sync(event: object, *, background: bool = False) -> None:
        from app.lib.events import get_bus

        await get_bus().emit(event, background=False)

    monkeypatch.setattr("app.services.auth.emit", _emit_sync)
    monkeypatch.setattr(
        "app.events.handlers.email.send_verification_email",
        _fake_send,
    )
    return sent


async def test_register_sends_verification_email(
    client: AsyncClient,
    mock_send_email: list[dict[str, str]],
) -> None:
    response = await client.post(
        "/users/register",
        json={
            "name": "Ada Lovelace",
            "email": "ada@example.com",
            "password": "secret123",
            "client_app": "backoffice",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "ada@example.com"
    assert body["email_verified"] is False
    assert len(mock_send_email) == 1
    assert mock_send_email[0]["to"] == "ada@example.com"
    assert "/verify-email?token=" in mock_send_email[0]["verify_url"]
    assert "localhost:5173" in mock_send_email[0]["verify_url"]

    login = await client.post(
        "/users/login",
        json={"email": "ada@example.com", "password": "secret123"},
    )
    assert login.status_code == 403


async def test_register_requires_client_app(client: AsyncClient) -> None:
    response = await client.post(
        "/users/register",
        json={
            "name": "Ada Lovelace",
            "email": "ada@example.com",
            "password": "secret123",
        },
    )
    assert response.status_code == 422


async def test_login_blocked_until_verified(
    client: AsyncClient,
    mock_send_email: list[dict[str, str]],
) -> None:
    await client.post(
        "/users/register",
        json={
            "name": "Ada Lovelace",
            "email": "ada@example.com",
            "password": "secret123",
            "client_app": "seller",
        },
    )
    login = await client.post(
        "/users/login",
        json={"email": "ada@example.com", "password": "secret123"},
    )
    assert login.status_code == 403
    assert login.json()["detail"] == "Email not verified"
    assert "localhost:5174" in mock_send_email[0]["verify_url"]


async def test_verify_email_and_login(
    client: AsyncClient,
    mock_send_email: list[dict[str, str]],
) -> None:
    await client.post(
        "/users/register",
        json={
            "name": "Ada Lovelace",
            "email": "ada@example.com",
            "password": "secret123",
            "client_app": "backoffice",
        },
    )
    token = mock_send_email[0]["verify_url"].split("token=", 1)[1]

    verify = await client.post("/users/verify-email", json={"token": token})
    assert verify.status_code == 200

    login = await client.post(
        "/users/login",
        json={"email": "ada@example.com", "password": "secret123"},
    )
    assert login.status_code == 200
    assert "access_token" in login.json()

    me = await client.get(
        "/users/me",
        headers={"Authorization": f"Bearer {login.json()['access_token']}"},
    )
    assert me.status_code == 200
    assert me.json()["email_verified"] is True


async def test_verify_invalid_token(client: AsyncClient) -> None:
    response = await client.post(
        "/users/verify-email",
        json={"token": "not-a-real-token"},
    )
    assert response.status_code == 400


async def test_verify_expired_token(
    client: AsyncClient,
    mock_send_email: list[dict[str, str]],
) -> None:
    await client.post(
        "/users/register",
        json={
            "name": "Ada Lovelace",
            "email": "ada@example.com",
            "password": "secret123",
            "client_app": "backoffice",
        },
    )
    token = mock_send_email[0]["verify_url"].split("token=", 1)[1]

    session_maker = app.state.session_maker
    async with session_maker() as session:
        result = await session.execute(
            select(User).where(User.email == "ada@example.com")
        )
        user = result.scalar_one()
        user.email_verification_expires_at = utc_now() - timedelta(hours=1)
        session.add(user)
        await session.commit()

    response = await client.post("/users/verify-email", json={"token": token})
    assert response.status_code == 400


async def test_resend_verification_regenerates_token(
    client: AsyncClient,
    mock_send_email: list[dict[str, str]],
) -> None:
    await client.post(
        "/users/register",
        json={
            "name": "Ada Lovelace",
            "email": "ada@example.com",
            "password": "secret123",
            "client_app": "backoffice",
        },
    )
    first_token = mock_send_email[0]["verify_url"].split("token=", 1)[1]

    resend = await client.post(
        "/users/resend-verification",
        json={"email": "ada@example.com", "client_app": "seller"},
    )
    assert resend.status_code == 200
    assert len(mock_send_email) == 2
    second_token = mock_send_email[1]["verify_url"].split("token=", 1)[1]
    assert second_token != first_token
    assert "localhost:5174" in mock_send_email[1]["verify_url"]

    old = await client.post("/users/verify-email", json={"token": first_token})
    assert old.status_code == 400

    new = await client.post("/users/verify-email", json={"token": second_token})
    assert new.status_code == 200


async def test_resend_requires_client_app(client: AsyncClient) -> None:
    response = await client.post(
        "/users/resend-verification",
        json={"email": "ada@example.com"},
    )
    assert response.status_code == 422


async def test_factory_verified_user_can_login(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    user = await user_factory.build(
        email="verified@example.com",
        password="secret123",
        email_verified=True,
    )
    login = await client.post(
        "/users/login",
        json={"email": user["email"], "password": "secret123"},
    )
    assert login.status_code == 200
