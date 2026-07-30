from sqlalchemy import UniqueConstraint
from sqlmodel import Field

from app.lib.persistence.organization_entity_model import OrganizationEntityModel


class Tag(OrganizationEntityModel, table=True):
    __tablename__ = "tag"
    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "name",
            name="uq_tag_organization_id_name",
        ),
    )

    name: str = Field(max_length=255, index=True)
    is_active: bool = Field(default=True)
