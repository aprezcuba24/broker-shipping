from uuid import UUID

from sqlalchemy import BigInteger, Column, Enum as SAEnum, UniqueConstraint
from sqlmodel import Field

from app.lib.persistence.organization_entity_model import OrganizationEntityModel
from app.models.order.enums import Currency


class ProviderMessagingPrice(OrganizationEntityModel, table=True):
    __tablename__ = "provider_messaging_price"
    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "neighborhood_id",
            name="uq_provider_messaging_price_org_neighborhood",
        ),
    )

    neighborhood_id: UUID = Field(foreign_key="neighborhood.id", index=True)
    amount: int = Field(
        sa_column=Column(BigInteger, nullable=False),
    )
    currency: Currency = Field(
        sa_column=Column(
            SAEnum(
                Currency,
                values_callable=lambda x: [e.value for e in x],
                name="currency",
            ),
            nullable=False,
        ),
    )
