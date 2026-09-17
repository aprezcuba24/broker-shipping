from sqlalchemy import BigInteger, CheckConstraint, Column, Enum as SAEnum
from sqlmodel import Field

from app.lib.persistence.organization_entity_model import OrganizationEntityModel
from app.models.order.enums import Currency


class Product(OrganizationEntityModel, table=True):
    __tablename__ = "product"
    __table_args__ = (
        CheckConstraint("stock >= 0", name="ck_product_stock_non_negative"),
        CheckConstraint("reserved >= 0", name="ck_product_reserved_non_negative"),
    )

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
    price: int = Field(
        default=0,
        sa_column=Column(BigInteger, nullable=False, server_default="0"),
    )
    commission: int = Field(
        default=0,
        sa_column=Column(BigInteger, nullable=False, server_default="0"),
    )
    stock: int = Field(default=0, ge=0)
    reserved: int = Field(default=0, ge=0)
    image_key: str | None = Field(default=None, max_length=512)
