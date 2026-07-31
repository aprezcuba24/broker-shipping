from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.deps import get_db
from app.lib.persistence.pagination import PaginationDep
from app.lib.security.deps import SellerOrgDep
from app.schemas.customer import CustomerCreate, CustomerPublic, CustomerUpdate
from app.schemas.pagination import Page
from app.services.customer import seller as seller_customer_service

router = APIRouter(prefix="/customers/seller", tags=["customers"])


@router.get("/", response_model=Page[CustomerPublic])
async def list_customers(
    organization: SellerOrgDep,
    session: Annotated[AsyncSession, Depends(get_db)],
    pagination: PaginationDep,
    name: str | None = None,
    ci: str | None = None,
    phone: str | None = None,
) -> Page[CustomerPublic]:
    result = await seller_customer_service.list_customers_for_seller(
        session,
        organization.id,
        pagination=pagination,
        name=name,
        ci=ci,
        phone=phone,
    )
    return Page.from_mapped(result, pagination, CustomerPublic.model_validate)


@router.get("/{customer_id}", response_model=CustomerPublic)
async def get_customer(
    customer_id: UUID,
    organization: SellerOrgDep,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> CustomerPublic:
    customer = await seller_customer_service.get_customer_for_seller(
        session,
        customer_id,
        organization.id,
    )
    return CustomerPublic.model_validate(customer)


@router.post("/", response_model=CustomerPublic, status_code=201)
async def create_customer(
    body: CustomerCreate,
    organization: SellerOrgDep,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> CustomerPublic:
    customer = await seller_customer_service.create_customer(
        session,
        organization.id,
        body,
    )
    return CustomerPublic.model_validate(customer)


@router.patch("/{customer_id}", response_model=CustomerPublic)
async def patch_customer(
    customer_id: UUID,
    body: CustomerUpdate,
    organization: SellerOrgDep,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> CustomerPublic:
    customer = await seller_customer_service.update_customer(
        session,
        customer_id,
        organization.id,
        body,
    )
    return CustomerPublic.model_validate(customer)


@router.delete("/{customer_id}", status_code=204)
async def delete_customer(
    customer_id: UUID,
    organization: SellerOrgDep,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> Response:
    await seller_customer_service.delete_customer(
        session,
        customer_id,
        organization.id,
    )
    return Response(status_code=204)
