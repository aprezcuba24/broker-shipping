from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    Column,
    DateTime,
    Enum as SAEnum,
    Index,
    text,
)
from sqlmodel import Field

from app.lib.persistence.entity_model import EntityModel
from app.models.customer.enums import PhoneBlacklistReason


class PhoneBlacklist(EntityModel, table=True):
    __tablename__ = "phone_blacklist"
    __table_args__ = (
        Index(
            "uq_phone_blacklist_active_org_phone",
            "organization_id",
            "phone",
            unique=True,
            postgresql_where=text("withdrawn_at IS NULL"),
        ),
        Index(
            "ix_phone_blacklist_phone",
            "phone",
        ),
    )

    phone: str = Field(max_length=50)
    organization_id: UUID = Field(
        foreign_key="organization.id",
        index=True,
    )
    created_by_user_id: UUID = Field(
        foreign_key="user.id",
        index=True,
    )
    reason: PhoneBlacklistReason = Field(
        sa_column=Column(
            SAEnum(
                PhoneBlacklistReason,
                values_callable=lambda x: [e.value for e in x],
                name="phoneblacklistreason",
            ),
            nullable=False,
        ),
    )
    note: str | None = Field(default=None, max_length=500)
    withdrawn_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime, nullable=True),
    )
