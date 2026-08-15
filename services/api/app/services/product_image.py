from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.persistence import get_entity
from app.lib.storage.deps import get_object_storage
from app.lib.storage.keys import (
    PRESIGNED_PUT_EXPIRES_SECONDS,
    extension_for_content_type,
    product_image_key,
)
from app.models.product.product import Product
from app.schemas.product import (
    ProductImageConfirmRequest,
    ProductImagePresignRequest,
    ProductImagePresignResponse,
)
from app.services import product_tag as product_tag_service


async def presign_product_image_upload(
    session: AsyncSession,
    product_id: UUID,
    organization_id: UUID,
    data: ProductImagePresignRequest,
) -> ProductImagePresignResponse:
    product = await get_entity(
        session,
        Product,
        id=product_id,
        organization_id=organization_id,
    )
    extension = extension_for_content_type(data.content_type)
    image_key = product_image_key(organization_id, product.id, extension)
    storage = get_object_storage()
    presigned = await storage.generate_presigned_put(
        key=image_key,
        content_type=data.content_type,
        expires_in=PRESIGNED_PUT_EXPIRES_SECONDS,
    )
    return ProductImagePresignResponse(
        upload_url=presigned.upload_url,
        image_key=image_key,
        headers=presigned.headers,
        expires_in=presigned.expires_in,
    )


async def confirm_product_image(
    session: AsyncSession,
    product_id: UUID,
    organization_id: UUID,
    data: ProductImageConfirmRequest,
) -> Product:
    product = await get_entity(
        session,
        Product,
        id=product_id,
        organization_id=organization_id,
    )
    storage = get_object_storage()
    previous_key = product.image_key
    if previous_key and previous_key != data.image_key:
        await storage.delete_object(previous_key)
    product.image_key = data.image_key
    session.add(product)
    await session.commit()
    await session.refresh(product)
    await product_tag_service.attach_tags_to_products(session, [product])
    return product


async def delete_product_image(
    session: AsyncSession,
    product_id: UUID,
    organization_id: UUID,
) -> None:
    product = await get_entity(
        session,
        Product,
        id=product_id,
        organization_id=organization_id,
    )
    if product.image_key:
        await get_object_storage().delete_object(product.image_key)
    product.image_key = None
    session.add(product)
    await session.commit()
