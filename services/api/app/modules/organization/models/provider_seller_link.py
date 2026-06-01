from datetime import datetime
from uuid import UUID

from sqlalchemy import Column, ForeignKey
from sqlmodel import Field, SQLModel

from app.lib.utils import utc_now


class ProviderSellerLink(SQLModel, table=True):
    """Commercial link between a provider org and a seller org."""

    __tablename__ = "provider_seller_link"

    provider_organization_id: UUID = Field(
        sa_column=Column(
            ForeignKey("organization.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )
    seller_organization_id: UUID = Field(
        sa_column=Column(
            ForeignKey("organization.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )
    is_active: bool = Field(default=True)
    linked_at: datetime = Field(default_factory=utc_now)
