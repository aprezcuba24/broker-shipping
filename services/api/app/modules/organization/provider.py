from dishka import Provider, Scope, provide
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.organization.repositories import OrganizationRepository
from app.modules.organization.services import OrganizationService


class OrganizationProvider(Provider):
    scope = Scope.REQUEST

    @provide
    def organization_repository(self, session: AsyncSession) -> OrganizationRepository:
        return OrganizationRepository(session)

    @provide
    def organization_service(
        self, repo: OrganizationRepository
    ) -> OrganizationService:
        return OrganizationService(repository=repo)
