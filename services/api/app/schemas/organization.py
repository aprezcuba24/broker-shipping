from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.organization.enums import OrganizationType
from app.schemas.fields import NonEmptyStr
from app.types import PlatformProductCode, SELF_SERVICE_PLATFORM_PRODUCT_CODES


class OrganizationCreate(BaseModel):
    name: NonEmptyStr = Field(max_length=255)
    type: OrganizationType
    platform_product_codes: list[PlatformProductCode] | None = Field(
        default=None,
        min_length=1,
    )

    @field_validator("platform_product_codes")
    @classmethod
    def only_self_service_codes(
        cls,
        value: list[PlatformProductCode] | None,
    ) -> list[PlatformProductCode] | None:
        if value is None:
            return value
        invalid = [code for code in value if code not in SELF_SERVICE_PLATFORM_PRODUCT_CODES]
        if invalid:
            raise ValueError(
                "platform product codes not available for self-service: "
                + ", ".join(code.value for code in invalid)
            )
        return value


class OrganizationUpdate(BaseModel):
    name: NonEmptyStr | None = Field(default=None, max_length=255)


class OrganizationPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    type: OrganizationType
    created_at: datetime
    updated_at: datetime | None


class LinkedSellerPublic(OrganizationPublic):
    has_pending_commissions: bool
