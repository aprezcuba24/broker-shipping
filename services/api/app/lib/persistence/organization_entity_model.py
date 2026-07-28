from uuid import UUID

from sqlmodel import Field

from app.lib.persistence.entity_model import EntityModel


class OrganizationEntityModel(EntityModel):
    """CRUD entities scoped to a single organization (tenant)."""

    organization_id: UUID = Field(
        foreign_key="organization.id",
        index=True,
    )
