from datetime import datetime
from uuid import UUID

from sqlalchemy import Column, ForeignKey
from sqlmodel import Field, SQLModel

from app.lib.utils import utc_now


class OrganizationPlatformProduct(SQLModel, table=True):
    """Which platform products an organization may use (access only, not billing)."""

    __tablename__ = "organization_platform_product"

    organization_id: UUID = Field(
        sa_column=Column(
            ForeignKey("organization.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )
    platform_product_id: UUID = Field(
        sa_column=Column(
            ForeignKey("platform_product.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )
    enabled: bool = Field(default=True)
    granted_at: datetime = Field(default_factory=utc_now)
