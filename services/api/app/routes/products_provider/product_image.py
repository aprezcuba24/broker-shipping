from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Body, Depends, Response
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

from app.deps import SessionDep
from app.lib.security.deps import ProviderManagementOrgDep
from app.schemas.product import (
    ProductImageConfirmRequest,
    ProductImagePresignRequest,
    ProductImagePresignResponse,
    ProductProviderPublic,
    product_to_provider_public,
)
from app.services import product_image as product_image_service

router = APIRouter(prefix="/products/provider", tags=["products"])


def _validated_image_confirm(
    product_id: UUID,
    organization: ProviderManagementOrgDep,
    body: Annotated[ProductImageConfirmRequest, Body()],
) -> ProductImageConfirmRequest:
    try:
        return ProductImageConfirmRequest.for_product(
            body,
            organization_id=organization.id,
            product_id=product_id,
        )
    except ValidationError as exc:
        raise RequestValidationError(exc.errors()) from exc


ValidatedProductImageConfirm = Annotated[
    ProductImageConfirmRequest,
    Depends(_validated_image_confirm),
]


@router.post(
    "/{product_id}/image/presign",
    response_model=ProductImagePresignResponse,
)
async def presign_product_image(
    product_id: UUID,
    body: ProductImagePresignRequest,
    organization: ProviderManagementOrgDep,
    session: SessionDep,
) -> ProductImagePresignResponse:
    return await product_image_service.presign_product_image_upload(
        session,
        product_id,
        organization.id,
        body,
    )


@router.put("/{product_id}/image", response_model=ProductProviderPublic)
async def confirm_product_image(
    product_id: UUID,
    body: ValidatedProductImageConfirm,
    organization: ProviderManagementOrgDep,
    session: SessionDep,
) -> ProductProviderPublic:
    product = await product_image_service.confirm_product_image(
        session,
        product_id,
        organization.id,
        body,
    )
    return product_to_provider_public(product)


@router.delete("/{product_id}/image", status_code=204)
async def delete_product_image(
    product_id: UUID,
    organization: ProviderManagementOrgDep,
    session: SessionDep,
) -> Response:
    await product_image_service.delete_product_image(
        session,
        product_id,
        organization.id,
    )
    return Response(status_code=204)
