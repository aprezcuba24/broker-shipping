from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.fields import NonEmptyStr


class ProvinceCreate(BaseModel):
    name: NonEmptyStr = Field(max_length=255)


class ProvinceUpdate(BaseModel):
    name: NonEmptyStr | None = Field(default=None, max_length=255)


class ProvincePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    created_at: datetime
    updated_at: datetime | None = None


class MunicipalityCreate(BaseModel):
    name: NonEmptyStr = Field(max_length=255)
    province_id: UUID


class MunicipalityUpdate(BaseModel):
    name: NonEmptyStr | None = Field(default=None, max_length=255)
    province_id: UUID | None = None


class MunicipalityPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    province_id: UUID
    province_name: str | None = None
    created_at: datetime
    updated_at: datetime | None = None


class NeighborhoodCreate(BaseModel):
    name: NonEmptyStr = Field(max_length=255)
    municipality_id: UUID


class NeighborhoodUpdate(BaseModel):
    name: NonEmptyStr | None = Field(default=None, max_length=255)
    municipality_id: UUID | None = None


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
