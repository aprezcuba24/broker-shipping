from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any, Self
from uuid import UUID

from pydantic import (
    AfterValidator,
    BaseModel,
    ConfigDict,
    Field,
    ValidationInfo,
    model_validator,
)

from app.lib.storage.deps import get_object_storage
from app.lib.storage.keys import (
    ALLOWED_IMAGE_CONTENT_TYPES,
    validate_product_image_key,
)
from app.models.order.enums import Currency
from app.models.product.product import Product
from app.schemas.fields import NonEmptyStr
from app.schemas.tag import TagPublic


def _allowed_image_content_type(value: str) -> str:
    if value not in ALLOWED_IMAGE_CONTENT_TYPES:
        raise ValueError("Unsupported image content type")
    return value


ImageContentType = Annotated[
    str,
    AfterValidator(_allowed_image_content_type),
    Field(json_schema_extra={"enum": sorted(ALLOWED_IMAGE_CONTENT_TYPES)}),
]


class ProductCreate(BaseModel):
    name: NonEmptyStr = Field(max_length=255)
    tag_ids: list[UUID] = Field(default_factory=list)
    price: int = Field(default=0, ge=0)
    commission: int = Field(default=0, ge=0)
    currency: Currency = Currency.cup


class ProductUpdate(ProductCreate):
    name: NonEmptyStr | None = Field(default=None, max_length=255)
    tag_ids: list[UUID] | None = None
    price: int | None = Field(default=None, ge=0)
    commission: int | None = Field(default=None, ge=0)
    currency: Currency | None = None


class ProductPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    organization_id: UUID
    price: int
    commission: int
    currency: Currency
    created_at: datetime
    updated_at: datetime | None
    tags: list[TagPublic] = Field(default_factory=list)
    image_url: str | None = None


class ProductImagePresignRequest(BaseModel):
    content_type: ImageContentType


class ProductImagePresignResponse(BaseModel):
    upload_url: str
    image_key: str
    headers: dict[str, str]
    expires_in: int


class ProductImageConfirmRequest(BaseModel):
    image_key: NonEmptyStr = Field(max_length=512)

    @model_validator(mode="after")
    def validate_image_key_for_product(self, info: ValidationInfo) -> Self:
        context = info.context or {}
        organization_id = context.get("organization_id")
        product_id = context.get("product_id")
        if organization_id is None or product_id is None:
            return self
        if not validate_product_image_key(
            organization_id,
            product_id,
            self.image_key,
        ):
            raise ValueError("Invalid image key for this product")
        return self

    @classmethod
    def for_product(
        cls,
        data: ProductImageConfirmRequest | dict[str, Any],
        *,
        organization_id: UUID,
        product_id: UUID,
    ) -> ProductImageConfirmRequest:
        payload = data.model_dump() if isinstance(data, BaseModel) else data
        return cls.model_validate(
            payload,
            context={
                "organization_id": organization_id,
                "product_id": product_id,
            },
        )


def product_to_public(product: Product) -> ProductPublic:
    data = ProductPublic.model_validate(product)
    return data.model_copy(
        update={"image_url": get_object_storage().build_public_url(product.image_key)}
    )
