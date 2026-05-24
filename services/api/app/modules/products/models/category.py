from sqlmodel import Field

from app.lib.persistence import OrganizationEntityModel


class Category(OrganizationEntityModel, table=True):
    name: str = Field(max_length=255)
