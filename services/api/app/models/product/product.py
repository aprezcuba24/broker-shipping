from sqlmodel import Field

from app.lib.persistence.organization_entity_model import OrganizationEntityModel


class Product(OrganizationEntityModel, table=True):
    __tablename__ = "product"

    name: str = Field(max_length=255, index=True)
