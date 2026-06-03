from __future__ import annotations

import re
import secrets
from uuid import UUID

from fastapi import Request

from app.lib.event_dispatcher import EventDispatcher
from app.lib.persistence import BaseService
from app.lib.post_commit import PostCommitQueue
from app.lib.security.passwords import hash_password, verify_password
from app.lib.security.tokens import encode_access_token
from app.modules.user.events import UserCreated, UserLoginAttempt
from app.modules.user.models import User
from app.modules.user.repositories import UserRepository


class UserService(BaseService[User]):
    def __init__(
        self,
        repository: UserRepository,
        dispatcher: EventDispatcher,
        post_commit: PostCommitQueue,
    ) -> None:
        super().__init__(repository, dispatcher, post_commit)

    @classmethod
    def creation_exclude(cls) -> frozenset[str]:
        return User.IMMUTABLE_FIELDS

    @classmethod
    def patch_allowed_keys(cls) -> frozenset[str]:
        return frozenset(User.model_fields.keys()) - User.IMMUTABLE_FIELDS

    async def on_create(self, entity: User) -> None:
        self.post_commit_emit(UserCreated(entity=entity))

    async def authenticate(
        self,
        username: str,
        password: str,
        request: Request,
    ) -> User | None:
        user = await self._repo.get_by_username(username)
        if user is None:
            return None
        if not verify_password(password, user.password_hash):
            return None
        allowed = await self._dispatcher.emit_gate(
            UserLoginAttempt(entity=user, request=request),
        )
        if not allowed:
            return None
        return user

    def issue_access_token(self, user: User) -> str:
        return encode_access_token(user.id)

    async def get_by_id_or_none(self, user_id: UUID) -> User | None:
        return await self.get(user_id)

    async def find_or_create_customer_by_phone(self, phone: str) -> User:
        existing = await self._repo.get_by_phone(phone)
        if existing is not None:
            return existing

        base_username = re.sub(r"[^a-zA-Z0-9_]", "_", phone).strip("_") or "customer"
        username = base_username
        suffix = 0
        while await self._repo.get_by_username(username) is not None:
            suffix += 1
            username = f"{base_username}_{suffix}"

        user = User(
            username=username,
            phone=phone,
            password_hash=hash_password(secrets.token_urlsafe(32)),
        )
        return await self.create(user)
