from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.security.passwords import hash_password
from app.modules.user.models import User


async def create_user(
    session: AsyncSession,
    *,
    username: str,
    password: str,
    is_super_admin: bool = False,
) -> dict:
    entity = User(
        username=username,
        password_hash=hash_password(password),
        is_super_admin=is_super_admin,
    )
    session.add(entity)
    await session.flush()
    await session.commit()
    dump = entity.model_dump(mode="json")
    dump["_password_plain"] = password
    return dump


class UserFactory:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._n = 0

    async def build(
        self,
        *,
        username: str | None = None,
        password: str = "secret123",
        is_super_admin: bool = False,
    ) -> dict:
        self._n += 1
        uname = username or f"user_{self._n:04d}"
        return await create_user(
            self._session,
            username=uname,
            password=password,
            is_super_admin=is_super_admin,
        )
