from uuid import UUID

from fastapi import HTTPException

from app.lib.persistence import BaseService, FilterSpec, OrgScopedServiceMixin
from app.modules.orders.models.customer import CUSTOMER_LIST_FILTER_SPEC, Customer
from app.modules.orders.repositories.address_repository import AddressRepository
from app.modules.orders.repositories.customer_repository import CustomerRepository
from app.modules.orders.schemas import AddressInput, CustomerDetail, CustomerInput
from app.modules.orders.models.address import Address
from app.modules.orders.services.address_service import AddressService
from app.modules.organization.models import Organization


class CustomerService(OrgScopedServiceMixin[Customer], BaseService[Customer]):
    def __init__(
        self,
        repository: CustomerRepository,
        address_repository: AddressRepository,
        address_service: AddressService,
    ) -> None:
        super().__init__(repository)
        self._address_repo = address_repository
        self._address_service = address_service

    @classmethod
    def creation_exclude(cls) -> frozenset[str]:
        return Customer.IMMUTABLE_FIELDS

    @classmethod
    def patch_allowed_keys(cls) -> frozenset[str]:
        return frozenset(Customer.model_fields.keys()) - Customer.IMMUTABLE_FIELDS

    @classmethod
    def list_filter_spec(cls) -> FilterSpec[Customer]:
        return CUSTOMER_LIST_FILTER_SPEC

    async def get_detail_for_organization(
        self,
        customer_id: UUID,
        organization_id: UUID,
        *,
        detail: str = "Customer not found",
    ) -> CustomerDetail:
        customer = await self.get_or_404_for_organization(
            customer_id,
            organization_id,
            detail=detail,
        )
        addresses = await self._address_repo.list_for_customer(customer.id)
        return CustomerDetail.from_entities(customer, addresses)

    async def find_conflict_for_organization(
        self,
        organization_id: UUID,
        *,
        phone: str,
        identification: str,
    ) -> Customer | None:
        return await self._repo.find_collisions(
            organization_id,
            phone=phone,
            identification=identification,
        )

    async def create_for_organization(
        self,
        organization_id: UUID,
        data: CustomerInput,
    ) -> Customer:
        entity = Customer(
            organization_id=organization_id,
            name=data.name,
            phone=data.phone,
            identification=data.identification,
        )
        return await self.create(entity)

    async def ensure_no_conflict_or_400(
        self,
        organization_id: UUID,
        data: CustomerInput,
    ) -> None:
        conflict = await self.find_conflict_for_organization(
            organization_id,
            phone=data.phone,
            identification=data.identification,
        )
        if conflict is not None:
            raise HTTPException(
                status_code=400,
                detail=(
                    "A customer with this phone or identification already exists; "
                    "use customer_id"
                ),
            )

    async def resolve_customer_and_address(
        self,
        customer_id: UUID | None,
        customer: CustomerInput | None,
        address_id: UUID | None,
        address: AddressInput | None,
        organization: Organization,
    ) -> tuple[Customer, Address]:
        customer_entity = None
        if customer is not None:
            await self.ensure_no_conflict_or_400(
                organization.id,
                customer,
            )
            customer_entity = await self.create_for_organization(
                organization.id,
                customer,
            )
        else:
            customer_entity = await self.get_or_404_for_organization(
                customer_id,
                organization.id,
            )
        address_entity = None
        if address is not None:
            address_entity = await self._address_service.create_and_activate(
                customer_entity.id,
                address,
            )
        else:
            address_entity = await self._address_service.get_for_customer_or_404(
                address_id,
                customer_entity.id,
            )
        return customer_entity, address_entity
