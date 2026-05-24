from sqlmodel import Field

from app.lib.persistence import EntityModel


class Organization(EntityModel, table=True):
    name: str = Field(max_length=255)
