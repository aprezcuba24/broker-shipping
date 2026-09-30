from datetime import datetime
from uuid import UUID

from sqlalchemy import BigInteger, CheckConstraint, Column, DateTime, ForeignKey
from sqlmodel import Field, SQLModel

from app.lib.utils import utc_now


class SellerProduct(SQLModel, table=True):
    """Seller-specific overlay on a provider product (e.g. sale price)."""

    __tablename__ = "seller_product"
    __table_args__ = (
        CheckConstraint(
            "sale_price IS NULL OR sale_price >= 0",
            name="ck_seller_product_sale_price_non_negative",
        ),
    )

    seller_organization_id: UUID = Field(
        sa_column=Column(
            ForeignKey("organization.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )
    product_id: UUID = Field(
        sa_column=Column(
            ForeignKey("product.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )
    sale_price: int | None = Field(
        default=None,
        sa_column=Column(BigInteger, nullable=True),
    )
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    updated_at: datetime | None = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )
