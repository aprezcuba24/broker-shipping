from typing import ClassVar
from uuid import UUID

from sqlalchemy import Column, ForeignKey
from sqlmodel import Field

from app.lib.persistence import EntityModel


class Order(EntityModel, table=True):
    __tablename__ = "order"

    IMMUTABLE_FIELDS: ClassVar[frozenset[str]] = EntityModel.IMMUTABLE_FIELDS | frozenset(
        {"seller_organization_id", "customer_id"},
    )

    name: str = Field(max_length=255)
    seller_organization_id: UUID = Field(
        sa_column=Column(
            ForeignKey("organization.id", ondelete="RESTRICT"),
            nullable=False,
            index=True,
        ),
    )
    customer_id: UUID = Field(
        sa_column=Column(
            ForeignKey("user.id", ondelete="RESTRICT"),
            nullable=False,
            index=True,
        ),
    )
