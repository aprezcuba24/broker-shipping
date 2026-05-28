from uuid import UUID

from sqlalchemy import Column, ForeignKey
from sqlmodel import Field

from app.lib.persistence import OrganizationEntityModel


class Product(OrganizationEntityModel, table=True):
    name: str = Field(max_length=255)
    category_id: UUID = Field(
        sa_column=Column(
            ForeignKey("category.id", ondelete="RESTRICT"),
            nullable=False,
            index=True,
        ),
    )
