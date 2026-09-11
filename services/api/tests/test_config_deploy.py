"""Tests for Settings DATABASE_URL handling."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.config import Settings, _adapt_ssl_query, _normalize_database_url


@pytest.mark.parametrize(
    ("raw", "async_driver", "expected_prefix"),
    [
        ("postgres://u:p@h:5432/db", True, "postgresql+asyncpg://"),
        ("postgresql://u:p@h:5432/db", True, "postgresql+asyncpg://"),
        ("postgresql+asyncpg://u:p@h:5432/db", True, "postgresql+asyncpg://"),
        ("postgres://u:p@h:5432/db", False, "postgresql://"),
        ("postgresql+asyncpg://u:p@h:5432/db", False, "postgresql://"),
    ],
)
def test_normalize_database_url(
    raw: str, async_driver: bool, expected_prefix: str
) -> None:
    out = _normalize_database_url(raw, async_driver=async_driver)
    assert out.startswith(expected_prefix)
    assert "u:p@h:5432/db" in out


def test_ssl_query_asyncpg_from_sslmode() -> None:
    url = _normalize_database_url(
        "postgresql://u:p@h:5432/db?sslmode=require",
        async_driver=True,
    )
    assert "ssl=require" in url
    assert "sslmode" not in url


def test_ssl_query_sync_keeps_sslmode() -> None:
    url = _normalize_database_url(
        "postgresql://u:p@h:5432/db?sslmode=require",
        async_driver=False,
    )
    assert "sslmode=require" in url


def test_adapt_ssl_noop_without_ssl() -> None:
    url = "postgresql://u:p@h:5432/db"
    assert _adapt_ssl_query(url) == url


def test_settings_requires_database_url(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("DATABASE_URL", raising=False)
    with pytest.raises((ValidationError, ValueError)):
        Settings(_env_file=None)  # type: ignore[call-arg]


def test_settings_database_url(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgres://rail:secret@pg.railway.internal:5432/railway?sslmode=require",
    )
    s = Settings(_env_file=None)  # type: ignore[call-arg]
    assert s.database_url.startswith("postgresql+asyncpg://")
    assert "ssl=require" in s.database_url
    assert s.database_url_sync.startswith("postgresql://")
    assert "+asyncpg" not in s.database_url_sync
    assert "sslmode=require" in s.database_url_sync
