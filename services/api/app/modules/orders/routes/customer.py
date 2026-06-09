from typing import Annotated
from uuid import UUID

from dishka import FromDishka
from dishka.integrations.fastapi import DishkaRoute
from fastapi import APIRouter, Depends

from app.lib.security.deps import get_tenant
from app.modules.orders.models.customer import CustomerListFilters, customer_list_filters
from app.modules.orders.schemas import CustomerDetail, CustomerSummary
from app.modules.orders.services.customer_service import CustomerService
from app.modules.organization.models import Organization, OrganizationType

router = APIRouter(route_class=DishkaRoute)


@router.get("/", response_model=list[CustomerSummary])
async def list_customers(
    service: FromDishka[CustomerService],
    organization: Annotated[Organization, Depends(get_tenant(OrganizationType.seller))],
    filters: Annotated[CustomerListFilters, Depends(customer_list_filters)],
):
    customers = await service.list_for_organization(organization.id, filters=filters)
    return [CustomerSummary.model_validate(c) for c in customers]


@router.get("/{customer_id}", response_model=CustomerDetail)
async def get_customer(
    customer_id: UUID,
    service: FromDishka[CustomerService],
    organization: Annotated[Organization, Depends(get_tenant(OrganizationType.seller))],
):
    return await service.get_detail_for_organization(customer_id, organization.id)
