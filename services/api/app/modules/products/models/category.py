from sqlmodel import Field

from app.lib.organization_entity_model import OrganizationEntityModel


class Category(OrganizationEntityModel, table=True):
    name: str = Field(max_length=255)
