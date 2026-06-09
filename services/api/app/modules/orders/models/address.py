from uuid import UUID

from sqlalchemy import Column, ForeignKey
from sqlmodel import Field

from app.lib.persistence import EntityModel


class Address(EntityModel, table=True):
    __tablename__ = "address"

    customer_id: UUID = Field(
        sa_column=Column(
            ForeignKey("customer.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
    )
    province: str = Field(max_length=255)
    municipality: str = Field(max_length=255)
    district: str = Field(max_length=255)
    neighborhood: str = Field(max_length=255)
    address: str = Field(max_length=255)
    reference: str | None = Field(default=None, max_length=255)
    is_active: bool = Field(default=False)
