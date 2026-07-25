from __future__ import annotations

import secrets
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from app.lib.security.access import load_active_api_key_by_prefix
from app.lib.security.api_keys import generate_api_key, hash_secret, split_raw
from app.lib.utils import utc_now
from app.models.user.api_key import ApiKey
from app.schemas.api_key import ApiKeyCreate


async def create_for_user(
    session: AsyncSession,
    user_id: UUID,
    data: ApiKeyCreate,
) -> tuple[str, ApiKey]:
    raw, prefix, secret_hash = generate_api_key()
    entity = ApiKey(
        name=data.name,
        description=data.description,
        created_by_user_id=user_id,
        prefix=prefix,
        secret_hash=secret_hash,
    )
    session.add(entity)
    await session.commit()
    await session.refresh(entity)
    return raw, entity


async def verify_raw(session: AsyncSession, raw: str) -> ApiKey | None:
    parts = split_raw(raw)
    if parts is None:
        return None
    prefix, secret_plain = parts
    row = await load_active_api_key_by_prefix(session, prefix)
    if row is None:
        return None
    if not secrets.compare_digest(hash_secret(secret_plain), row.secret_hash):
        return None
    return row


async def list_for_user(session: AsyncSession, user_id: UUID) -> list[ApiKey]:
    result = await session.execute(
        select(ApiKey)
        .where(ApiKey.created_by_user_id == user_id)
        .order_by(col(ApiKey.created_at).desc())
    )
    return list(result.scalars().all())


async def revoke_for_user(
    session: AsyncSession,
    user_id: UUID,
    key_id: UUID,
) -> ApiKey:
    result = await session.execute(
        select(ApiKey).where(
            ApiKey.id == key_id,
            ApiKey.created_by_user_id == user_id,
        )
    )
    entity = result.scalar_one_or_none()
    if entity is None:
        raise HTTPException(status_code=404, detail="API key not found")
    if entity.revoked_at is None:
        entity.revoked_at = utc_now()
        entity.updated_at = utc_now()
        session.add(entity)
        await session.commit()
        await session.refresh(entity)
    return entity


async def touch_last_used(session: AsyncSession, api_key: ApiKey) -> None:
    api_key.last_used_at = utc_now()
    api_key.updated_at = utc_now()
    session.add(api_key)
    await session.commit()
