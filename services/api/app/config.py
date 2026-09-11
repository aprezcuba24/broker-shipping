from __future__ import annotations

from urllib.parse import parse_qsl, quote_plus, urlencode, urlparse, urlunparse

from pydantic import AliasChoices, Field, computed_field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.types import ClientApp


def _quote_pg_ident(value: str) -> str:
    return quote_plus(value, safe="")


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

    return raw


def _with_ssl_query(url: str, *, enabled: bool) -> str:
    """Ensure driver-appropriate SSL query params; strip libpq-only keys for asyncpg."""
    if not url:
        return url
    parsed = urlparse(url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    sslmode = query.pop("sslmode", None)
    existing_ssl = query.pop("ssl", None)
    query.pop("channel_binding", None)
    had_ssl = (
        enabled
        or sslmode in {"require", "verify-ca", "verify-full"}
        or (existing_ssl is not None and str(existing_ssl).lower() in {"1", "true", "require"})
    )
    if had_ssl:
        if parsed.scheme.endswith("+asyncpg"):
            query["ssl"] = "require"
        else:
            query["sslmode"] = "require"
    return urlunparse(parsed._replace(query=urlencode(query)))


class Settings(BaseSettings):
    """Carga `.env` en la raíz del monorepo; URLs de DB se derivan de las piezas."""

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env", "../../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    # If set (e.g. Railway Postgres plugin), overrides POSTGRES_* pieces.
    database_url_override: str = Field(
        default="",
        validation_alias=AliasChoices("DATABASE_URL", "database_url_override"),
    )
    postgres_user: str = Field(default="broker")
    postgres_password: str = Field(default="broker")
    postgres_host: str = Field(default="localhost")
    postgres_port: int = Field(default=6432)
    postgres_db: str = Field(default="broker")
    postgres_ssl: bool = Field(default=False)

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

    @field_validator("postgres_ssl", mode="before")
    @classmethod
    def _coerce_postgres_ssl(cls, value: object) -> bool:
        if isinstance(value, bool):
            return value
        if value is None or value == "":
            return False
        if isinstance(value, (int, float)):
            return bool(value)
        return str(value).strip().lower() in {"1", "true", "yes", "on"}

    def frontend_base_url(self, client_app: ClientApp) -> str:
        if client_app == "backoffice":
            return self.frontend_backoffice_url.rstrip("/")
        return self.frontend_seller_url.rstrip("/")

    def _built_database_url(self, *, async_driver: bool) -> str:
        override = self.database_url_override.strip()
        if override:
            url = _normalize_database_url(override, async_driver=async_driver)
        else:
            u = _quote_pg_ident(self.postgres_user)
            p = _quote_pg_ident(self.postgres_password)
            scheme = "postgresql+asyncpg" if async_driver else "postgresql"
            url = (
                f"{scheme}://{u}:{p}@"
                f"{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
            )
        return _with_ssl_query(url, enabled=self.postgres_ssl)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def database_url(self) -> str:
        return self._built_database_url(async_driver=True)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def database_url_sync(self) -> str:
        return self._built_database_url(async_driver=False)


settings = Settings()
