from sqlalchemy import Column, Enum as SAEnum, UniqueConstraint
from sqlmodel import Field

from app.lib.persistence.entity_model import EntityModel
from app.types import PlatformProductCode


class PlatformProduct(EntityModel, table=True):
    __tablename__ = "platform_product"
    __table_args__ = (UniqueConstraint("code", name="uq_platform_product_code"),)

    code: PlatformProductCode = Field(
        sa_column=Column(
            SAEnum(
                PlatformProductCode,
                values_callable=lambda x: [e.value for e in x],
                name="platformproductcode",
            ),
            nullable=False,
        ),
    )
    name: str = Field(max_length=255)
    description: str | None = Field(default=None, max_length=2000)
