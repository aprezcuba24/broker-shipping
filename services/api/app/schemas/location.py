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
