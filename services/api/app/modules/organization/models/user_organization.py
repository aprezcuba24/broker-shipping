from datetime import datetime
from uuid import UUID

from sqlalchemy import Column, ForeignKey
from sqlmodel import Field, SQLModel

from app.lib.utils import utc_now


class UserOrganization(SQLModel, table=True):
    """Links users to organizations (many-to-many)."""

    __tablename__ = "user_organization"

    user_id: UUID = Field(foreign_key="user.id", primary_key=True)
    organization_id: UUID = Field(
        sa_column=Column(
            ForeignKey("organization.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )
    joined_at: datetime = Field(default_factory=utc_now)
