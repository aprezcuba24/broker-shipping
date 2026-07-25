from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.security.api_keys import generate_api_key
from app.models.user.api_key import ApiKey


async def create_api_key_row(
    session: AsyncSession,
    *,
    user_id: UUID | str,
    name: str = "Test key",
    description: str | None = None,
) -> tuple[str, dict]:
    raw, prefix, secret_hash = generate_api_key()
    entity = ApiKey(
        name=name,
        description=description,
        created_by_user_id=UUID(str(user_id)),
        prefix=prefix,
        secret_hash=secret_hash,
    )
    session.add(entity)
    await session.flush()
    await session.commit()
    return raw, entity.model_dump(mode="json")


class ApiKeyFactory:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session
        self._n = 0

    async def build(
        self,
        *,
        user_id: UUID | str,
        name: str | None = None,
        description: str | None = None,
    ) -> tuple[str, dict]:
        self._n += 1
        return await create_api_key_row(
            self._session,
            user_id=user_id,
            name=name or f"Key {self._n:04d}",
            description=description,
        )
