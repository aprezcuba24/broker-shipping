from uuid import UUID

from sqlalchemy import Column, ForeignKey
from sqlmodel import Field, SQLModel


class ProductTag(SQLModel, table=True):
    """Many-to-many link between a product and a tag."""

    __tablename__ = "product_tag"

    product_id: UUID = Field(
        sa_column=Column(
            ForeignKey("product.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )
    tag_id: UUID = Field(
        sa_column=Column(
            ForeignKey("tag.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )
