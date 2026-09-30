from fastapi import APIRouter, Response
from uuid import UUID

from app.deps import SessionDep
from app.lib.security.deps import ProviderOrgDep
from app.schemas.messaging import (
    MessagingPriceCreate,
    MessagingPricePublic,
    MessagingPriceUpdate,
)
from app.services.messaging import price as messaging_price_service

router = APIRouter(prefix="/messaging-prices/provider", tags=["messaging"])


@router.get("/", response_model=list[MessagingPricePublic])
async def list_messaging_prices(
    organization: ProviderOrgDep,
    session: SessionDep,
) -> list[MessagingPricePublic]:
    prices = await messaging_price_service.list_messaging_prices(
        session,
        organization.id,
    )
    return [messaging_price_service.messaging_price_to_public(price) for price in prices]


@router.post("/", response_model=MessagingPricePublic, status_code=201)
async def create_messaging_price(
    body: MessagingPriceCreate,
    organization: ProviderOrgDep,
    session: SessionDep,
) -> MessagingPricePublic:
    price = await messaging_price_service.create_messaging_price(
        session,
        organization.id,
        body,
    )
    return messaging_price_service.messaging_price_to_public(price)


@router.patch("/{price_id}", response_model=MessagingPricePublic)
async def patch_messaging_price(
    price_id: UUID,
    body: MessagingPriceUpdate,
    organization: ProviderOrgDep,
    session: SessionDep,
) -> MessagingPricePublic:
    price = await messaging_price_service.update_messaging_price(
        session,
        price_id,
        organization.id,
        body,
    )
    return messaging_price_service.messaging_price_to_public(price)


@router.delete("/{price_id}", status_code=204)
async def delete_messaging_price(
    price_id: UUID,
    organization: ProviderOrgDep,
    session: SessionDep,
) -> Response:
    await messaging_price_service.delete_messaging_price(
        session,
        price_id,
        organization.id,
    )
    return Response(status_code=204)
