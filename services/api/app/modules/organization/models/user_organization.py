from datetime import datetime
from uuid import UUID

from sqlalchemy import Column, Enum as SAEnum, ForeignKey
from sqlmodel import Field, SQLModel

from app.lib.utils import utc_now
from app.modules.organization.models.enums import OrgMemberRole


class UserOrganization(SQLModel, table=True):
    """Links users to organizations (many-to-many) with role and active flag."""

    __tablename__ = "user_organization"

    user_id: UUID = Field(foreign_key="user.id", primary_key=True)
    organization_id: UUID = Field(
        sa_column=Column(
            ForeignKey("organization.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )
    role: OrgMemberRole = Field(
        default=OrgMemberRole.provider,
        sa_column=Column(
            SAEnum(OrgMemberRole, values_callable=lambda x: [e.value for e in x]),
            nullable=False,
        ),
    )
    is_active: bool = Field(default=True)
    joined_at: datetime = Field(default_factory=utc_now)
