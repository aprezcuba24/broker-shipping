from __future__ import annotations

from uuid import UUID, uuid4

CONTENT_TYPE_EXTENSIONS: dict[str, str] = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}

ALLOWED_IMAGE_CONTENT_TYPES: frozenset[str] = frozenset(CONTENT_TYPE_EXTENSIONS)

PRESIGNED_PUT_EXPIRES_SECONDS = 15 * 60
MAX_IMAGE_BYTES = 5 * 1024 * 1024


def provider_prefix(organization_id: UUID) -> str:
    return f"providers/{organization_id}"


def seller_prefix(organization_id: UUID) -> str:
    return f"sellers/{organization_id}"


def product_image_prefix(organization_id: UUID, product_id: UUID) -> str:
    return f"{provider_prefix(organization_id)}/products/{product_id}"


def ads_message_photo_prefix(organization_id: UUID, ads_message_id: UUID) -> str:
    return f"{seller_prefix(organization_id)}/ads-messages/{ads_message_id}"


def product_image_key(
    organization_id: UUID,
    product_id: UUID,
    extension: str,
) -> str:
    ext = extension.lstrip(".").lower()
    return f"{product_image_prefix(organization_id, product_id)}/{uuid4()}.{ext}"


def ads_message_photo_key(
    organization_id: UUID,
    ads_message_id: UUID,
    extension: str,
) -> str:
    ext = extension.lstrip(".").lower()
    return (
        f"{ads_message_photo_prefix(organization_id, ads_message_id)}"
        f"/{uuid4()}.{ext}"
    )


def extension_for_content_type(content_type: str) -> str:
    try:
        return CONTENT_TYPE_EXTENSIONS[content_type]
    except KeyError as exc:
        raise ValueError(f"Unsupported content type: {content_type}") from exc


def _validate_keyed_object(
    *,
    prefix: str,
    key: str,
) -> bool:
    full_prefix = f"{prefix}/"
    if not key.startswith(full_prefix):
        return False
    remainder = key[len(full_prefix) :]
    if not remainder or "/" in remainder or ".." in remainder:
        return False
    return True


def validate_product_image_key(
    organization_id: UUID,
    product_id: UUID,
    key: str,
) -> bool:
    return _validate_keyed_object(
        prefix=product_image_prefix(organization_id, product_id),
        key=key,
    )


def validate_ads_message_photo_key(
    organization_id: UUID,
    ads_message_id: UUID,
    key: str,
) -> bool:
    return _validate_keyed_object(
        prefix=ads_message_photo_prefix(organization_id, ads_message_id),
        key=key,
    )
