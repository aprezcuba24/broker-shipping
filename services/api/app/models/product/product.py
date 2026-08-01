from decimal import Decimal

from sqlalchemy import Column, Enum as SAEnum, Numeric
from sqlmodel import Field

from app.lib.persistence.organization_entity_model import OrganizationEntityModel
from app.models.order.enums import Currency


class Product(OrganizationEntityModel, table=True):
    __tablename__ = "product"

    name: str = Field(max_length=255, index=True)
    currency: Currency = Field(
        default=Currency.cup,
        sa_column=Column(
            SAEnum(
                Currency,
                values_callable=lambda x: [e.value for e in x],
                name="currency",
            ),
            nullable=False,
            server_default="cup",
        ),
    )
    price: Decimal = Field(
        default=Decimal("0"),
        sa_column=Column(Numeric(12, 2), nullable=False, server_default="0"),
    )
    commission: Decimal = Field(
        default=Decimal("0"),
        sa_column=Column(Numeric(12, 2), nullable=False, server_default="0"),
    )
