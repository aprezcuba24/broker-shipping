from __future__ import annotations

import os
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from pydantic import AliasChoices, Field, computed_field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.types import ClientApp


def _normalize_database_url(url: str, *, async_driver: bool) -> str:
    """Normalize Railway/libpq URLs to SQLAlchemy sync or asyncpg form."""
    raw = url.strip()
    if not raw:
        return raw

    if raw.startswith("postgres://"):
        raw = "postgresql://" + raw[len("postgres://") :]

    if async_driver:
        if raw.startswith("postgresql+asyncpg://"):
            pass
        elif raw.startswith("postgresql://"):
            raw = "postgresql+asyncpg://" + raw[len("postgresql://") :]
    else:
        if raw.startswith("postgresql+asyncpg://"):
            raw = "postgresql://" + raw[len("postgresql+asyncpg://") :]
        elif not raw.startswith("postgresql://"):
            if "://" not in raw:
                raw = "postgresql://" + raw

    return _adapt_ssl_query(raw)


def _adapt_ssl_query(url: str) -> str:
    """Map libpq sslmode to asyncpg ssl= when needed; drop channel_binding."""
    if not url:
        return url
    parsed = urlparse(url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    sslmode = query.pop("sslmode", None)
    existing_ssl = query.pop("ssl", None)
    query.pop("channel_binding", None)
    wants_ssl = sslmode in {"require", "verify-ca", "verify-full"} or (
        existing_ssl is not None
        and str(existing_ssl).lower() in {"1", "true", "require"}
    )
    if wants_ssl:
        if parsed.scheme.endswith("+asyncpg"):
            query["ssl"] = "require"
        else:
            query["sslmode"] = "require"
    return urlunparse(parsed._replace(query=urlencode(query)))


class Settings(BaseSettings):
    """Carga `.env` en la raíz del monorepo. La API solo usa DATABASE_URL."""

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env", "../../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    # Required DSN — only DATABASE_URL (never POSTGRES_* pieces).
    database_dsn: str = Field(
        ...,
        min_length=1,
        validation_alias=AliasChoices("DATABASE_URL", "database_dsn"),
        description="Postgres connection URL (API never builds URL from POSTGRES_*).",
    )

    jwt_secret: str = Field(default="change-me-in-production-use-32b+")
    jwt_algorithm: str = Field(default="HS256")
    jwt_expire_minutes: int = Field(default=60 * 24)

    smtp_host: str = Field(default="localhost")
    smtp_port: int = Field(default=1025)
    smtp_user: str = Field(default="")
    smtp_password: str = Field(default="")
    smtp_use_tls: bool = Field(default=False)
    mail_from: str = Field(default="noreply@broker.local")
    email_verification_token_hours: int = Field(default=24)
    frontend_backoffice_url: str = Field(default="http://localhost:5173")
    frontend_seller_url: str = Field(default="http://localhost:5174")

    aws_access_key_id: str = Field(default="")
    aws_secret_access_key: str = Field(default="")
    aws_region: str = Field(default="us-east-1")
    s3_bucket: str = Field(default="")
    aws_endpoint_url: str = Field(default="")
    s3_public_base_url: str = Field(default="")

    @model_validator(mode="before")
    @classmethod
    def _require_database_url(cls, data: Any) -> Any:
        """Require DATABASE_URL (no POSTGRES_* fallback)."""
        if not isinstance(data, dict):
            return data
        chosen = (
            os.environ.get("DATABASE_URL", "").strip()
            or str(data.get("DATABASE_URL") or "").strip()
            or str(data.get("database_dsn") or "").strip()
        )
        if not chosen:
            raise ValueError(
                "DATABASE_URL is required. "
                "Example: postgresql://broker:broker@localhost:6432/broker. "
                "The API no longer builds a URL from POSTGRES_* pieces."
            )
        data["database_dsn"] = chosen
        return data

    def frontend_base_url(self, client_app: ClientApp) -> str:
        if client_app == "backoffice":
            return self.frontend_backoffice_url.rstrip("/")
        return self.frontend_seller_url.rstrip("/")

    @computed_field  # type: ignore[prop-decorator]
    @property
    def database_url(self) -> str:
        """Async SQLAlchemy URL (postgresql+asyncpg://...)."""
        return _normalize_database_url(self.database_dsn, async_driver=True)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def database_url_sync(self) -> str:
        """Sync SQLAlchemy / psycopg2 URL (postgresql://...)."""
        return _normalize_database_url(self.database_dsn, async_driver=False)


settings = Settings()
