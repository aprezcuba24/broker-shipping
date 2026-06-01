from dishka import Provider, Scope, provide
from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.event_dispatcher import EventDispatcher
from app.lib.post_commit import PostCommitQueue
from app.modules.organization.services import ProviderSellerLinkService
from app.modules.products.repositories import CategoryRepository, ProductRepository
from app.modules.products.services import CategoryService, ProductService


class ProductsProvider(Provider):
    scope = Scope.REQUEST

    @provide
    def product_repository(self, session: AsyncSession) -> ProductRepository:
        return ProductRepository(session)

    @provide
    def product_service(
        self,
        repo: ProductRepository,
        dispatcher: EventDispatcher,
        post_commit: PostCommitQueue,
        link_service: ProviderSellerLinkService,
    ) -> ProductService:
        return ProductService(
            repository=repo,
            dispatcher=dispatcher,
            post_commit=post_commit,
            link_service=link_service,
        )

    @provide
    def category_repository(self, session: AsyncSession) -> CategoryRepository:
        return CategoryRepository(session)

    @provide
    def category_service(self, repo: CategoryRepository) -> CategoryService:
        return CategoryService(repository=repo)
