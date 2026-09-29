from uuid import UUID

from sqlalchemy import UniqueConstraint
from sqlmodel import Field

from app.lib.persistence.entity_model import EntityModel


class Neighborhood(EntityModel, table=True):
    __tablename__ = "neighborhood"
    __table_args__ = (
        UniqueConstraint(
            "municipality_id",
            "name",
            name="uq_neighborhood_municipality_id_name",
        ),
    )

    name: str = Field(max_length=255, index=True)
    municipality_id: UUID = Field(foreign_key="municipality.id", index=True)
