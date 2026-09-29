from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ProvincePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str


class MunicipalityPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    province_id: UUID


class NeighborhoodPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    municipality_id: UUID
    municipality_name: str | None = None
    province_id: UUID | None = None
    province_name: str | None = None
    created_at: datetime
    updated_at: datetime | None = None
