from uuid import UUID

from sqlmodel import Field

from app.lib.persistence.entity_model import EntityModel


class Address(EntityModel, table=True):
    __tablename__ = "address"

    address: str = Field(max_length=500)
    customer_id: UUID = Field(foreign_key="customer.id", index=True)
    province_id: UUID = Field(foreign_key="province.id", index=True)
    municipality_id: UUID = Field(foreign_key="municipality.id", index=True)
