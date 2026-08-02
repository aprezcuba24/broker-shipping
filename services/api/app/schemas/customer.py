from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.fields import NonEmptyStr


class AddressCreate(BaseModel):
    address: NonEmptyStr = Field(max_length=500)
    province_id: UUID
    municipality_id: UUID


class AddressPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    address: str
    province_id: UUID
    municipality_id: UUID
    customer_id: UUID
    created_at: datetime
    updated_at: datetime | None


class CustomerCreate(BaseModel):
    name: NonEmptyStr = Field(max_length=255)
    ci: NonEmptyStr = Field(max_length=50)
    phone: NonEmptyStr = Field(max_length=50)
    address: AddressCreate


class CustomerUpdate(BaseModel):
    name: NonEmptyStr | None = Field(default=None, max_length=255)
    ci: NonEmptyStr | None = Field(default=None, max_length=50)
    phone: NonEmptyStr | None = Field(default=None, max_length=50)
    address: AddressCreate | None = None


class CustomerPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    ci: str
    phone: str
    seller_organization_id: UUID
    created_at: datetime
    updated_at: datetime | None
    address: AddressPublic | None = None
