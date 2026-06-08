from dishka import Provider, Scope, provide
from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.event_dispatcher import EventDispatcher
from app.lib.post_commit import PostCommitQueue
from app.modules.organization.repositories import (
    ApiKeyRepository,
    OrganizationInvitationRepository,
    OrganizationRepository,
    ProviderSellerLinkRepository,
    UserOrganizationRepository,
)
from app.modules.organization.services import (
    ApiKeyService,
    InvitationService,
    MembershipService,
    OrganizationService,
    ProviderSellerLinkService,
)
from app.modules.user.repositories.user_repository import UserRepository


class OrganizationProvider(Provider):
    scope = Scope.REQUEST

    @provide
    def organization_repository(self, session: AsyncSession) -> OrganizationRepository:
        return OrganizationRepository(session)

    @provide
    def user_organization_repository(self, session: AsyncSession) -> UserOrganizationRepository:
        return UserOrganizationRepository(session)

    @provide
    def organization_invitation_repository(
        self,
        session: AsyncSession,
    ) -> OrganizationInvitationRepository:
        return OrganizationInvitationRepository(session)

    @provide
    def provider_seller_link_repository(
        self,
        session: AsyncSession,
    ) -> ProviderSellerLinkRepository:
        return ProviderSellerLinkRepository(session)

    @provide
    def provider_seller_link_service(
        self,
        link_repo: ProviderSellerLinkRepository,
        org_repo: OrganizationRepository,
    ) -> ProviderSellerLinkService:
        return ProviderSellerLinkService(link_repo, org_repo)

    @provide
    def api_key_repository(self, session: AsyncSession) -> ApiKeyRepository:
        return ApiKeyRepository(session)

    @provide
    def organization_service(
        self,
        repo: OrganizationRepository,
        user_org_repo: UserOrganizationRepository,
        dispatcher: EventDispatcher,
        post_commit: PostCommitQueue,
    ) -> OrganizationService:
        return OrganizationService(
            repository=repo,
            user_organization_repository=user_org_repo,
            dispatcher=dispatcher,
            post_commit=post_commit,
        )

    @provide
    def membership_service(
        self,
        user_org_repo: UserOrganizationRepository,
        link_service: ProviderSellerLinkService,
    ) -> MembershipService:
        return MembershipService(user_org_repo, link_service)

    @provide
    def invitation_service(
        self,
        invitation_repo: OrganizationInvitationRepository,
        user_org_repo: UserOrganizationRepository,
        org_repo: OrganizationRepository,
        link_service: ProviderSellerLinkService,
        organization_service: OrganizationService,
        user_repo: UserRepository,
    ) -> InvitationService:
        return InvitationService(
            invitation_repo,
            user_org_repo,
            org_repo,
            link_service,
            organization_service,
            user_repo,
        )

    @provide
    def api_key_service(
        self,
        repo: ApiKeyRepository,
        dispatcher: EventDispatcher,
        post_commit: PostCommitQueue,
    ) -> ApiKeyService:
        return ApiKeyService(
            repository=repo,
            dispatcher=dispatcher,
            post_commit=post_commit,
        )
