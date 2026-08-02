from sqlmodel import Field

from app.lib.persistence.entity_model import EntityModel


class Province(EntityModel, table=True):
    __tablename__ = "province"

    name: str = Field(max_length=255, index=True)
