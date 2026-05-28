from uuid import UUID

from sqlalchemy import Column, ForeignKey
from sqlmodel import Field

from app.lib.persistence import OrganizationEntityModel


class Category(OrganizationEntityModel, table=True):
    organization_id: UUID = Field(
        sa_column=Column(
            ForeignKey("organization.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
    )
    name: str = Field(max_length=255)
