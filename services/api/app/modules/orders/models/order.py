from typing import Any, ClassVar
from uuid import UUID

from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field

from app.lib.persistence import EntityModel


class Order(EntityModel, table=True):
    __tablename__ = "order"

    IMMUTABLE_FIELDS: ClassVar[frozenset[str]] = EntityModel.IMMUTABLE_FIELDS | frozenset(
        {
            "name",
            "seller_organization_id",
            "customer_id",
            "customer_snapshot",
            "address_snapshot",
        },
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
            ForeignKey("customer.id", ondelete="RESTRICT"),
            nullable=False,
            index=True,
        ),
    )
    customer_snapshot: dict[str, Any] = Field(
        sa_column=Column(JSONB, nullable=False),
        description="Customer data at order time: customer_id, name, phone, identification.",
    )
    address_snapshot: dict[str, Any] = Field(
        sa_column=Column(JSONB, nullable=False),
        description=(
            "Address data at order time: address_id, province, municipality, "
            "district, neighborhood, address, reference."
        ),
    )
