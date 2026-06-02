from dishka import Provider, Scope, provide
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.orders.repositories import OrderLineRepository, OrderRepository
from app.modules.orders.services import OrderLineService, OrderService
from app.modules.products.services import ProductService
from app.modules.user.services import UserService


class OrdersProvider(Provider):
    scope = Scope.REQUEST

    @provide
    def order_line_repository(self, session: AsyncSession) -> OrderLineRepository:
        return OrderLineRepository(session)

    @provide
    def order_repository(self, session: AsyncSession) -> OrderRepository:
        return OrderRepository(session)

    @provide
    def order_line_service(self, repo: OrderLineRepository) -> OrderLineService:
        return OrderLineService(repository=repo)

    @provide
    def order_service(
        self,
        repo: OrderRepository,
        line_service: OrderLineService,
        product_service: ProductService,
        user_service: UserService,
    ) -> OrderService:
        return OrderService(
            repository=repo,
            line_service=line_service,
            product_service=product_service,
            user_service=user_service,
        )
