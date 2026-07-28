from datetime import datetime
from uuid import UUID

from sqlalchemy import Column, ForeignKey
from sqlmodel import Field

from app.lib.persistence.entity_model import EntityModel


class ApiKey(EntityModel, table=True):
    __tablename__ = "api_key"

    name: str = Field(max_length=255)
    description: str | None = Field(default=None, max_length=1024)
    created_by_user_id: UUID = Field(
        sa_column=Column(
            ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
    )
    prefix: str = Field(max_length=12, unique=True, index=True)
    secret_hash: str = Field(max_length=64)
    last_used_at: datetime | None = Field(default=None)
    revoked_at: datetime | None = Field(default=None)
