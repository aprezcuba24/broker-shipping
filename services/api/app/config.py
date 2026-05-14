from __future__ import annotations

from urllib.parse import quote_plus

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _quote_pg_ident(value: str) -> str:
    return quote_plus(value, safe="")


class Settings(BaseSettings):
    """Carga `.env` en la raíz del monorepo; URLs de DB y Redis se derivan de las piezas."""

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
    postgres_db_test: str = Field(default="broker_test")

    redis_host: str = Field(default="localhost")
    redis_port: int = Field(default=6379)
    redis_db: int = Field(default=0)

    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None
    aws_region: str = "us-east-1"
    s3_bucket: str | None = None
    aws_endpoint_url: str | None = None

    jwt_secret_key: str = Field(default="change-me")
    jwt_algorithm: str = Field(default="HS256")
    jwt_access_token_minutes: int = Field(default=60 * 24)

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

    @computed_field  # type: ignore[prop-decorator]
    @property
    def redis_url(self) -> str:
        return f"redis://{self.redis_host}:{self.redis_port}/{self.redis_db}"


settings = Settings()
