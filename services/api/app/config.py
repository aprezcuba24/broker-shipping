from __future__ import annotations

from urllib.parse import quote_plus

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _quote_pg_ident(value: str) -> str:
    return quote_plus(value, safe="")


class Settings(BaseSettings):
    """Carga `.env` en la raíz del monorepo; URLs de DB se derivan de las piezas."""

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env", "../../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    postgres_user: str = Field(default="broker")
    postgres_password: str = Field(default="broker")
    postgres_host: str = Field(default="localhost")
    postgres_port: int = Field(default=6432)
    postgres_db: str = Field(default="broker")

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

    @computed_field  # type: ignore[prop-decorator]
    @property
    def database_url(self) -> str:
        u = _quote_pg_ident(self.postgres_user)
        p = _quote_pg_ident(self.postgres_password)
        return (
            f"postgresql+asyncpg://{u}:{p}@"
            f"{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def database_url_sync(self) -> str:
        u = _quote_pg_ident(self.postgres_user)
        p = _quote_pg_ident(self.postgres_password)
        return (
            f"postgresql://{u}:{p}@"
            f"{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


settings = Settings()
