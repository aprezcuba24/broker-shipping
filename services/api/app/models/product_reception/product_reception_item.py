from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    Column,
    ForeignKey,
    UniqueConstraint,
)
from sqlmodel import Field

from app.lib.persistence.entity_model import EntityModel


class ProductReceptionItem(EntityModel, table=True):
    __tablename__ = "product_reception_item"
    __table_args__ = (
        CheckConstraint(
            "quantity > 0",
            name="ck_product_reception_item_quantity_positive",
        ),
        UniqueConstraint(
            "reception_id",
            "product_id",
            name="uq_product_reception_item_reception_product",
        ),
    )

    reception_id: UUID = Field(
        sa_column=Column(
            ForeignKey("product_reception.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
    )
    product_id: UUID = Field(foreign_key="product.id", index=True)
    quantity: int
