from sqlalchemy import UniqueConstraint
from sqlmodel import Field

from app.lib.persistence.organization_entity_model import OrganizationEntityModel


class FacebookGroup(OrganizationEntityModel, table=True):
    __tablename__ = "facebook_group"
    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "facebook_id",
            name="uq_facebook_group_organization_id_facebook_id",
        ),
    )

    name: str = Field(max_length=255, index=True)
    facebook_id: str = Field(max_length=255, index=True)
