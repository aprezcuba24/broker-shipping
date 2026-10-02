from datetime import datetime
from uuid import UUID

from sqlalchemy import Column, DateTime, Enum as SAEnum, ForeignKey, Index, UniqueConstraint
from sqlmodel import Field

from app.lib.persistence.entity_model import EntityModel
from app.models.product.enums import ShareChannel


class OrderShareConversion(EntityModel, table=True):
    __tablename__ = "order_share_conversion"
    __table_args__ = (
        UniqueConstraint(
            "order_id",
            "share_channel",
            name="uq_order_share_conversion_order_channel",
        ),
        Index(
            "ix_order_share_conversion_seller_channel_created",
            "seller_organization_id",
            "share_channel",
            "created_at",
        ),
    )

    order_id: UUID = Field(
        sa_column=Column(
            ForeignKey("order.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
    )
    seller_organization_id: UUID = Field(
        sa_column=Column(
            ForeignKey("organization.id"),
            nullable=False,
            index=True,
        ),
    )
    share_channel: ShareChannel = Field(
        sa_column=Column(
            SAEnum(
                ShareChannel,
                values_callable=lambda x: [e.value for e in x],
                name="sharechannel",
            ),
            nullable=False,
        ),
    )
    finished_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime, nullable=True),
    )
