from uuid import UUID

from sqlalchemy import UniqueConstraint
from sqlmodel import Field

from app.lib.persistence.entity_model import EntityModel


class Municipality(EntityModel, table=True):
    __tablename__ = "municipality"
    __table_args__ = (
        UniqueConstraint(
            "province_id",
            "name",
            name="uq_municipality_province_id_name",
        ),
    )

    name: str = Field(max_length=255, index=True)
    province_id: UUID = Field(foreign_key="province.id", index=True)
