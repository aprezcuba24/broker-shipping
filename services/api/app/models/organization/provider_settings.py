from sqlalchemy import Boolean, Column, UniqueConstraint
from sqlmodel import Field

from app.lib.persistence.organization_entity_model import OrganizationEntityModel


class ProviderSettings(OrganizationEntityModel, table=True):
    __tablename__ = "provider_settings"
    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            name="uq_provider_settings_organization_id",
        ),
    )

    accepts_unconfigured_neighborhoods: bool = Field(
        default=False,
        sa_column=Column(Boolean, nullable=False, server_default="false"),
    )
