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
def mock_send_password_reset(monkeypatch: pytest.MonkeyPatch) -> list[dict[str, str]]:
    sent: list[dict[str, str]] = []

    async def _fake_send(*, to: str, name: str, reset_url: str) -> None:
        sent.append({"to": to, "name": name, "reset_url": reset_url})

    async def _emit_sync(event: object, *, background: bool = False) -> None:
        from app.lib.events import get_bus

        await get_bus().emit(event, background=False)

    monkeypatch.setattr("app.services.auth.emit", _emit_sync)
    monkeypatch.setattr(
        "app.events.handlers.email.send_password_reset_email",
        _fake_send,
    )
    return sent


async def test_forgot_password_sends_recovery_email(
    client: AsyncClient,
    user_factory: UserFactory,
    mock_send_password_reset: list[dict[str, str]],
) -> None:
    user = await user_factory.build(
        email="ada@example.com",
        password="secret123",
        email_verified=True,
    )
    response = await client.post(
        "/users/forgot-password",
        json={"email": user["email"], "client_app": "backoffice"},
    )
    assert response.status_code == 200
    assert "recovery link has been sent" in response.json()["message"]
    assert len(mock_send_password_reset) == 1
    assert mock_send_password_reset[0]["to"] == "ada@example.com"
    assert "/reset-password?token=" in mock_send_password_reset[0]["reset_url"]
    assert "localhost:5173" in mock_send_password_reset[0]["reset_url"]


async def test_forgot_password_unknown_email_is_silent(
    client: AsyncClient,
    mock_send_password_reset: list[dict[str, str]],
) -> None:
    response = await client.post(
        "/users/forgot-password",
        json={"email": "missing@example.com", "client_app": "seller"},
    )
    assert response.status_code == 200
    assert "recovery link has been sent" in response.json()["message"]
    assert mock_send_password_reset == []


async def test_forgot_password_requires_client_app(client: AsyncClient) -> None:
    response = await client.post(
        "/users/forgot-password",
        json={"email": "ada@example.com"},
    )
    assert response.status_code == 422


async def test_reset_password_and_login(
    client: AsyncClient,
    user_factory: UserFactory,
    mock_send_password_reset: list[dict[str, str]],
) -> None:
    user = await user_factory.build(
        email="ada@example.com",
        password="secret123",
        email_verified=True,
    )
    await client.post(
        "/users/forgot-password",
        json={"email": user["email"], "client_app": "seller"},
    )
    token = mock_send_password_reset[0]["reset_url"].split("token=", 1)[1]
    assert "localhost:5174" in mock_send_password_reset[0]["reset_url"]

    reset = await client.post(
        "/users/reset-password",
        json={"token": token, "password": "newpass99"},
    )
    assert reset.status_code == 200

    old = await client.post(
        "/users/login",
        json={"email": user["email"], "password": "secret123"},
    )
    assert old.status_code == 401

    login = await client.post(
        "/users/login",
        json={"email": user["email"], "password": "newpass99"},
    )
    assert login.status_code == 200
    assert "access_token" in login.json()

    reused = await client.post(
        "/users/reset-password",
        json={"token": token, "password": "anotherpass"},
    )
    assert reused.status_code == 400


async def test_reset_password_verifies_unverified_user(
    client: AsyncClient,
    user_factory: UserFactory,
    mock_send_password_reset: list[dict[str, str]],
) -> None:
    user = await user_factory.build(
        email="unverified@example.com",
        password="secret123",
        email_verified=False,
    )
    await client.post(
        "/users/forgot-password",
        json={"email": user["email"], "client_app": "backoffice"},
    )
    token = mock_send_password_reset[0]["reset_url"].split("token=", 1)[1]

    reset = await client.post(
        "/users/reset-password",
        json={"token": token, "password": "newpass99"},
    )
    assert reset.status_code == 200

    login = await client.post(
        "/users/login",
        json={"email": user["email"], "password": "newpass99"},
    )
    assert login.status_code == 200


async def test_reset_invalid_token(client: AsyncClient) -> None:
    response = await client.post(
        "/users/reset-password",
        json={"token": "not-a-real-token", "password": "newpass99"},
    )
    assert response.status_code == 400


async def test_reset_expired_token(
    client: AsyncClient,
    user_factory: UserFactory,
    mock_send_password_reset: list[dict[str, str]],
) -> None:
    user = await user_factory.build(
        email="ada@example.com",
        password="secret123",
        email_verified=True,
    )
    await client.post(
        "/users/forgot-password",
        json={"email": user["email"], "client_app": "backoffice"},
    )
    token = mock_send_password_reset[0]["reset_url"].split("token=", 1)[1]

    session_maker = app.state.session_maker
    async with session_maker() as session:
        result = await session.execute(
            select(User).where(User.email == "ada@example.com")
        )
        db_user = result.scalar_one()
        db_user.password_reset_expires_at = utc_now() - timedelta(hours=1)
        session.add(db_user)
        await session.commit()

    response = await client.post(
        "/users/reset-password",
        json={"token": token, "password": "newpass99"},
    )
    assert response.status_code == 400


async def test_forgot_password_regenerates_token(
    client: AsyncClient,
    user_factory: UserFactory,
    mock_send_password_reset: list[dict[str, str]],
) -> None:
    user = await user_factory.build(
        email="ada@example.com",
        password="secret123",
        email_verified=True,
    )
    await client.post(
        "/users/forgot-password",
        json={"email": user["email"], "client_app": "backoffice"},
    )
    first_token = mock_send_password_reset[0]["reset_url"].split("token=", 1)[1]

    resend = await client.post(
        "/users/forgot-password",
        json={"email": user["email"], "client_app": "seller"},
    )
    assert resend.status_code == 200
    assert len(mock_send_password_reset) == 2
    second_token = mock_send_password_reset[1]["reset_url"].split("token=", 1)[1]
    assert second_token != first_token
    assert "localhost:5174" in mock_send_password_reset[1]["reset_url"]

    old = await client.post(
        "/users/reset-password",
        json={"token": first_token, "password": "newpass99"},
    )
    assert old.status_code == 400

    new = await client.post(
        "/users/reset-password",
        json={"token": second_token, "password": "newpass99"},
    )
    assert new.status_code == 200
