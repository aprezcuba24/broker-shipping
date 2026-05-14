from datetime import datetime
from uuid import UUID

from sqlmodel import Field, SQLModel

from app.lib.utils import utc_now


class UserOrganization(SQLModel, table=True):
    """Links users to organizations (many-to-many)."""

    user_id: UUID = Field(foreign_key="user.id", primary_key=True)
    organization_id: UUID = Field(foreign_key="organization.id", primary_key=True)
    joined_at: datetime = Field(default_factory=utc_now)
