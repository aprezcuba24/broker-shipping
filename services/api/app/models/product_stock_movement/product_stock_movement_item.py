from uuid import UUID

from sqlalchemy import (
    CheckConstraint,
    Column,
    ForeignKey,
    UniqueConstraint,
)
from sqlmodel import Field

from app.lib.persistence.entity_model import EntityModel


class ProductStockMovementItem(EntityModel, table=True):
    __tablename__ = "product_stock_movement_item"
    __table_args__ = (
        CheckConstraint(
            "quantity > 0",
            name="ck_product_stock_movement_item_quantity_positive",
        ),
        UniqueConstraint(
            "movement_id",
            "product_id",
            name="uq_product_stock_movement_item_movement_product",
        ),
    )

    movement_id: UUID = Field(
        sa_column=Column(
            ForeignKey("product_stock_movement.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
    )
    product_id: UUID = Field(foreign_key="product.id", index=True)
    quantity: int
