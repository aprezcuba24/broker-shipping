from datetime import datetime
from typing import ClassVar

from sqlalchemy import Column, Enum as SAEnum
from sqlmodel import Field

from app.lib.persistence import EntityModel
from app.modules.organization.models.enums import OrganizationType


class Organization(EntityModel, table=True):
    IMMUTABLE_FIELDS: ClassVar[frozenset[str]] = EntityModel.IMMUTABLE_FIELDS | frozenset(
        {"deleted_at", "type"},
    )

    name: str = Field(max_length=255)
    type: OrganizationType = Field(
        default=OrganizationType.provider,
        sa_column=Column(
            SAEnum(OrganizationType, values_callable=lambda x: [e.value for e in x]),
            nullable=False,
        ),
    )
    deleted_at: datetime | None = Field(default=None)
