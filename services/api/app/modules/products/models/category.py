from uuid import UUID

from sqlmodel import Field

from app.lib.entity_model import EntityModel


class Category(EntityModel, table=True):
    name: str = Field(max_length=255)
    organization_id: UUID = Field(foreign_key="organization.id", index=True)
