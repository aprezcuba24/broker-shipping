from uuid import UUID

from sqlalchemy import Index, UniqueConstraint
from sqlmodel import Field

from app.lib.persistence.entity_model import EntityModel


class Customer(EntityModel, table=True):
    __tablename__ = "customer"
    __table_args__ = (
        UniqueConstraint(
            "seller_organization_id",
            "ci",
            name="uq_customer_seller_ci",
        ),
        Index("ix_customer_seller_phone", "seller_organization_id", "phone"),
    )

    name: str = Field(max_length=255)
    ci: str = Field(max_length=50)
    phone: str = Field(max_length=50)
    seller_organization_id: UUID = Field(
        foreign_key="organization.id",
        index=True,
    )
