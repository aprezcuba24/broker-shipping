from __future__ import annotations

from uuid import UUID

from app.lib.base_service import BaseService
from app.lib.security.passwords import verify_password
from app.lib.security.tokens import encode_access_token
from app.modules.user.events import UserCreated
from app.modules.user.models import User


class UserService(BaseService[User]):
    @classmethod
    def creation_exclude(cls) -> frozenset[str]:
        return User.IMMUTABLE_FIELDS

    @classmethod
    def patch_allowed_keys(cls) -> frozenset[str]:
        return frozenset(User.model_fields.keys()) - User.IMMUTABLE_FIELDS

    async def on_create(self, entity: User) -> None:
        self.post_commit_emit(UserCreated(entity=entity))

    async def authenticate(self, username: str, password: str) -> User | None:
        user = await self._repo.get_by_username(username)
        if user is None:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    def issue_access_token(self, user: User) -> str:
        return encode_access_token(user.id)

    async def get_by_id_or_none(self, user_id: UUID) -> User | None:
        return await self.get(user_id)
