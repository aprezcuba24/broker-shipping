from typing import ClassVar
from uuid import UUID

from sqlmodel import Field

from app.lib.entity_model import EntityModel


class OrganizationEntityModel(EntityModel):
    """CRUD entities scoped to a single organization (tenant)."""

    IMMUTABLE_FIELDS: ClassVar[frozenset[str]] = EntityModel.IMMUTABLE_FIELDS | frozenset(
        {"organization_id"},
    )

    organization_id: UUID = Field(foreign_key="organization.id", index=True, default=None)
