from sqlmodel import Field

from app.lib.persistence.entity_model import EntityModel


class Product(EntityModel, table=True):
    __tablename__ = "product"

    name: str = Field(max_length=255, index=True)
