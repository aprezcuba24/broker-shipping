from dishka import Provider, Scope, provide
from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.event_dispatcher import EventDispatcher
from app.lib.post_commit import PostCommitQueue
from app.modules.user.repositories import UserRepository
from app.modules.user.services import UserService


class UserProvider(Provider):
    scope = Scope.REQUEST

    @provide
    def user_repository(self, session: AsyncSession) -> UserRepository:
        return UserRepository(session)

    @provide
    def user_service(
        self,
        repo: UserRepository,
        dispatcher: EventDispatcher,
        post_commit: PostCommitQueue,
    ) -> UserService:
        return UserService(
            repository=repo,
            dispatcher=dispatcher,
            post_commit=post_commit,
        )
