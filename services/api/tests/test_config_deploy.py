"""Tests for production-oriented Settings (DATABASE_URL, SSL)."""

from __future__ import annotations

import pytest

from app.config import Settings, _normalize_database_url, _with_ssl_query


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
    out = _with_ssl_query(url, enabled=False)
    assert "ssl=require" in out
    assert "sslmode" not in out


def test_ssl_query_sync_when_enabled() -> None:
    url = _normalize_database_url("postgresql://u:p@h:5432/db", async_driver=False)
    out = _with_ssl_query(url, enabled=True)
    assert "sslmode=require" in out


def test_settings_database_url_override(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgres://rail:secret@pg.railway.internal:5432/railway?sslmode=require",
    )
    monkeypatch.delenv("POSTGRES_SSL", raising=False)
    s = Settings()
    assert s.database_url.startswith("postgresql+asyncpg://")
    assert "ssl=require" in s.database_url
    assert s.database_url_sync.startswith("postgresql://")
    assert "+asyncpg" not in s.database_url_sync
    assert "sslmode=require" in s.database_url_sync
