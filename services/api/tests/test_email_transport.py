"""Tests for email transport dispatcher (SMTP local vs SES API)."""

from __future__ import annotations

from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.config import Settings
from app.services.email import transport as email_transport


def _settings(**overrides: Any) -> Settings:
    base = {
        "database_dsn": "postgresql://broker:broker@localhost:6432/broker",
        "smtp_host": "localhost",
        "smtp_port": 1025,
        "smtp_user": "",
        "smtp_password": "",
        "smtp_use_tls": False,
        "mail_from": "noreply@broker.local",
        "aws_access_key_id": "",
        "aws_secret_access_key": "",
        "aws_region": "us-east-1",
        "aws_endpoint_url": "",
    }
    base.update(overrides)
    return Settings(_env_file=None, **base)


def test_use_local_smtp_for_mailhog_host() -> None:
    assert email_transport._use_local_smtp(_settings(smtp_host="mailhog"))
    assert email_transport._use_local_smtp(_settings(smtp_host="127.0.0.1"))
    assert email_transport._use_local_smtp(
        _settings(smtp_host="email-smtp.us-east-1.amazonaws.com", smtp_port=1025)
    )


def test_use_ses_when_remote_host_and_aws_keys() -> None:
    cfg = _settings(
        smtp_host="email-smtp.us-east-1.amazonaws.com",
        smtp_port=587,
        aws_access_key_id="AKIAEXAMPLE",
        aws_secret_access_key="secret",
    )
    assert not email_transport._use_local_smtp(cfg)
    assert email_transport._use_ses(cfg)


def test_local_smtp_wins_even_with_minio_aws_keys() -> None:
    cfg = _settings(
        smtp_host="localhost",
        smtp_port=1025,
        aws_access_key_id="minio",
        aws_secret_access_key="minio_secret",
        aws_endpoint_url="http://localhost:9000",
    )
    assert email_transport._use_local_smtp(cfg)
    assert not email_transport._use_ses(cfg)


def test_ses_client_kwargs_omit_endpoint_url() -> None:
    cfg = _settings(
        aws_access_key_id="AKIAEXAMPLE",
        aws_secret_access_key="secret",
        aws_endpoint_url="http://localhost:9000",
        aws_region="eu-west-1",
    )
    kwargs = email_transport._ses_client_kwargs(cfg)
    assert kwargs["service_name"] == "sesv2"
    assert kwargs["region_name"] == "eu-west-1"
    assert kwargs["aws_access_key_id"] == "AKIAEXAMPLE"
    assert "endpoint_url" not in kwargs


@pytest.mark.asyncio(loop_scope="session")
async def test_send_uses_smtp_for_local(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    cfg = _settings()
    monkeypatch.setattr(email_transport, "settings", cfg)
    smtp_mock = AsyncMock()
    monkeypatch.setattr(email_transport.aiosmtplib, "send", smtp_mock)
    ses_mock = AsyncMock()
    monkeypatch.setattr(email_transport, "_send_ses", ses_mock)

    await email_transport._send(to="a@b.com", subject="Hi", body="Body")

    smtp_mock.assert_awaited_once()
    ses_mock.assert_not_awaited()


@pytest.mark.asyncio(loop_scope="session")
async def test_send_uses_ses_for_production(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    cfg = _settings(
        smtp_host="7gjr7vzbrnyp.fips.wmjb.mail-manager-smtp.amazonaws.com",
        smtp_port=587,
        smtp_use_tls=True,
        mail_from="noreply@vendelo360.app",
        aws_access_key_id="AKIAEXAMPLE",
        aws_secret_access_key="secret",
        aws_endpoint_url="http://localhost:9000",
    )
    monkeypatch.setattr(email_transport, "settings", cfg)

    send_email = AsyncMock(return_value={"MessageId": "abc"})
    client = MagicMock()
    client.send_email = send_email
    client.__aenter__ = AsyncMock(return_value=client)
    client.__aexit__ = AsyncMock(return_value=None)

    session = MagicMock()
    session.client = MagicMock(return_value=client)
    monkeypatch.setattr(
        email_transport.aioboto3,
        "Session",
        MagicMock(return_value=session),
    )
    smtp_mock = AsyncMock()
    monkeypatch.setattr(email_transport.aiosmtplib, "send", smtp_mock)

    await email_transport._send(to="user@example.com", subject="Verify", body="Click")

    smtp_mock.assert_not_awaited()
    session.client.assert_called_once()
    call_kwargs = session.client.call_args.kwargs
    assert call_kwargs["service_name"] == "sesv2"
    assert "endpoint_url" not in call_kwargs
    send_email.assert_awaited_once()
    payload = send_email.await_args.kwargs
    assert payload["FromEmailAddress"] == "noreply@vendelo360.app"
    assert payload["Destination"] == {"ToAddresses": ["user@example.com"]}
    assert payload["Content"]["Simple"]["Subject"]["Data"] == "Verify"
    assert payload["Content"]["Simple"]["Body"]["Text"]["Data"] == "Click"
