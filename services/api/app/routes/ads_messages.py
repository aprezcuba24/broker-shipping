from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Body, Depends, Response
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

from app.deps import SessionDep
from app.lib.persistence.pagination import PaginationDep
from app.lib.security.deps import SellerOrgDep
from app.schemas.ads_message import (
    AdsMessageCreate,
    AdsMessagePhotoConfirmRequest,
    AdsMessagePhotoPresignRequest,
    AdsMessagePhotoPresignResponse,
    AdsMessagePublic,
    AdsMessageUpdate,
    ads_message_to_public,
)
from app.schemas.pagination import Page
from app.services import ads_message as ads_message_service
from app.services import ads_message_photo as ads_message_photo_service

router = APIRouter(prefix="/facebook/ads-messages", tags=["facebook"])


def _validated_photo_confirm(
    ads_message_id: UUID,
    organization: SellerOrgDep,
    body: Annotated[AdsMessagePhotoConfirmRequest, Body()],
) -> AdsMessagePhotoConfirmRequest:
    try:
        return AdsMessagePhotoConfirmRequest.for_ads_message(
            body,
            organization_id=organization.id,
            ads_message_id=ads_message_id,
        )
    except ValidationError as exc:
        raise RequestValidationError(exc.errors()) from exc


ValidatedAdsMessagePhotoConfirm = Annotated[
    AdsMessagePhotoConfirmRequest,
    Depends(_validated_photo_confirm),
]


@router.get("/", response_model=Page[AdsMessagePublic])
async def list_ads_messages(
    organization: SellerOrgDep,
    session: SessionDep,
    pagination: PaginationDep,
    title: str | None = None,
) -> Page[AdsMessagePublic]:
    result = await ads_message_service.list_ads_messages_for_organization(
        session,
        organization.id,
        pagination=pagination,
        title=title,
    )
    return Page.from_mapped(result, pagination, ads_message_to_public)


@router.get("/{ads_message_id}", response_model=AdsMessagePublic)
async def get_ads_message(
    ads_message_id: UUID,
    organization: SellerOrgDep,
    session: SessionDep,
) -> AdsMessagePublic:
    message = await ads_message_service.get_ads_message_for_organization(
        session,
        ads_message_id,
        organization.id,
    )
    return ads_message_to_public(message)


@router.post("/", response_model=AdsMessagePublic, status_code=201)
async def create_ads_message(
    body: AdsMessageCreate,
    organization: SellerOrgDep,
    session: SessionDep,
) -> AdsMessagePublic:
    message = await ads_message_service.create_ads_message(
        session,
        organization.id,
        body,
    )
    return ads_message_to_public(message)


@router.patch("/{ads_message_id}", response_model=AdsMessagePublic)
async def patch_ads_message(
    ads_message_id: UUID,
    body: AdsMessageUpdate,
    organization: SellerOrgDep,
    session: SessionDep,
) -> AdsMessagePublic:
    message = await ads_message_service.update_ads_message(
        session,
        ads_message_id,
        organization.id,
        body,
    )
    return ads_message_to_public(message)


@router.delete("/{ads_message_id}", status_code=204)
async def delete_ads_message(
    ads_message_id: UUID,
    organization: SellerOrgDep,
    session: SessionDep,
) -> Response:
    await ads_message_service.delete_ads_message(
        session,
        ads_message_id,
        organization.id,
    )
    return Response(status_code=204)


@router.post(
    "/{ads_message_id}/photo/presign",
    response_model=AdsMessagePhotoPresignResponse,
)
async def presign_ads_message_photo(
    ads_message_id: UUID,
    body: AdsMessagePhotoPresignRequest,
    organization: SellerOrgDep,
    session: SessionDep,
) -> AdsMessagePhotoPresignResponse:
    return await ads_message_photo_service.presign_ads_message_photo_upload(
        session,
        ads_message_id,
        organization.id,
        body,
    )


@router.put("/{ads_message_id}/photo", response_model=AdsMessagePublic)
async def confirm_ads_message_photo(
    ads_message_id: UUID,
    body: ValidatedAdsMessagePhotoConfirm,
    organization: SellerOrgDep,
    session: SessionDep,
) -> AdsMessagePublic:
    message = await ads_message_photo_service.confirm_ads_message_photo(
        session,
        ads_message_id,
        organization.id,
        body,
    )
    return ads_message_to_public(message)


@router.delete("/{ads_message_id}/photo", status_code=204)
async def delete_ads_message_photo(
    ads_message_id: UUID,
    organization: SellerOrgDep,
    session: SessionDep,
) -> Response:
    await ads_message_photo_service.delete_ads_message_photo(
        session,
        ads_message_id,
        organization.id,
    )
    return Response(status_code=204)
