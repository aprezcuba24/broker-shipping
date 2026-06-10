from dishka import Provider, Scope, provide
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.orders.repositories import (
    AddressRepository,
    CustomerRepository,
    OrderLineRepository,
    OrderRepository,
)
from app.modules.orders.services import (
    AddressService,
    CustomerService,
    OrderLineService,
    OrderService,
)
from app.modules.organization.repositories import (
    OrganizationRepository,
    SellerOrganizationDataRepository,
)
from app.modules.products.services import SellerProductService


class OrdersProvider(Provider):
    scope = Scope.REQUEST

    @provide
    def order_line_repository(self, session: AsyncSession) -> OrderLineRepository:
        return OrderLineRepository(session)

    @provide
    def order_repository(self, session: AsyncSession) -> OrderRepository:
        return OrderRepository(session)

    @provide
    def customer_repository(self, session: AsyncSession) -> CustomerRepository:
        return CustomerRepository(session)

    @provide
    def address_repository(self, session: AsyncSession) -> AddressRepository:
        return AddressRepository(session)

    @provide
    def order_line_service(self, repo: OrderLineRepository) -> OrderLineService:
        return OrderLineService(repository=repo)

    @provide
    def customer_service(
        self,
        customer_repo: CustomerRepository,
        address_repo: AddressRepository,
    ) -> CustomerService:
        return CustomerService(
            repository=customer_repo,
            address_repository=address_repo,
        )

    @provide
    def address_service(self, repo: AddressRepository) -> AddressService:
        return AddressService(repository=repo)

    @provide
    def order_service(
        self,
        repo: OrderRepository,
        line_service: OrderLineService,
        product_service: SellerProductService,
        customer_service: CustomerService,
        address_service: AddressService,
        org_repository: OrganizationRepository,
        seller_data_repository: SellerOrganizationDataRepository,
    ) -> OrderService:
        return OrderService(
            repository=repo,
            line_service=line_service,
            product_service=product_service,
            customer_service=customer_service,
            address_service=address_service,
            org_repository=org_repository,
            seller_data_repository=seller_data_repository,
        )
