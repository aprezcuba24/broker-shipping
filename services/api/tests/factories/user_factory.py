from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.security.passwords import hash_password
from app.models.user.user import User


async def create_user(
    session: AsyncSession,
    *,
    name: str,
    email: str,
    password: str,
    is_super_admin: bool = False,
) -> dict:
    entity = User(
        name=name,
        email=email,
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
        name: str | None = None,
        email: str | None = None,
        password: str = "secret123",
        is_super_admin: bool = False,
    ) -> dict:
        self._n += 1
        final_name = name or f"User {self._n:04d}"
        final_email = email or f"user_{self._n:04d}@example.com"
        return await create_user(
            self._session,
            name=final_name,
            email=final_email,
            password=password,
            is_super_admin=is_super_admin,
        )
