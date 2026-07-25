from sqlalchemy import Column, Enum as SAEnum
from sqlmodel import Field

from app.lib.persistence.entity_model import EntityModel
from app.models.organization.enums import OrganizationType


class Organization(EntityModel, table=True):
    __tablename__ = "organization"

    name: str = Field(max_length=255)
    type: OrganizationType = Field(
        default=OrganizationType.provider,
        sa_column=Column(
            SAEnum(
                OrganizationType,
                values_callable=lambda x: [e.value for e in x],
                name="organizationtype",
            ),
            nullable=False,
        ),
    )
