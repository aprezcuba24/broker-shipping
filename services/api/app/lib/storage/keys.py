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


def product_image_prefix(organization_id: UUID, product_id: UUID) -> str:
    return f"{provider_prefix(organization_id)}/products/{product_id}"


def product_image_key(
    organization_id: UUID,
    product_id: UUID,
    extension: str,
) -> str:
    ext = extension.lstrip(".").lower()
    return f"{product_image_prefix(organization_id, product_id)}/{uuid4()}.{ext}"


def extension_for_content_type(content_type: str) -> str:
    try:
        return CONTENT_TYPE_EXTENSIONS[content_type]
    except KeyError as exc:
        raise ValueError(f"Unsupported content type: {content_type}") from exc


def validate_product_image_key(
    organization_id: UUID,
    product_id: UUID,
    key: str,
) -> bool:
    prefix = f"{product_image_prefix(organization_id, product_id)}/"
    if not key.startswith(prefix):
        return False
    remainder = key[len(prefix) :]
    if not remainder or "/" in remainder or ".." in remainder:
        return False
    return True
