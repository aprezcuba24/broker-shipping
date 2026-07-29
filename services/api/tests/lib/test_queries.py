from __future__ import annotations

from uuid import uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.persistence import get_entity
from app.models.organization.organization import Organization
from tests.factories.organization_factory import OrganizationFactory
from tests.factories.user_factory import UserFactory


@pytest.mark.asyncio(loop_scope="session")
async def test_get_entity_returns_when_found(
    db_session: AsyncSession,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    user = await user_factory.build()
    org = await organization_factory.build(user_id=user["id"])

    found = await get_entity(db_session, Organization, id=org["id"])
    assert str(found.id) == org["id"]
    assert found.name == org["name"]


@pytest.mark.asyncio(loop_scope="session")
async def test_get_entity_returns_none_when_not_required(
    db_session: AsyncSession,
) -> None:
    found = await get_entity(
        db_session, Organization, id=uuid4(), required=False
    )
    assert found is None


@pytest.mark.asyncio(loop_scope="session")
async def test_get_entity_raises_404_by_default(
    db_session: AsyncSession,
) -> None:
    with pytest.raises(HTTPException) as exc_info:
        await get_entity(db_session, Organization, id=uuid4())
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Not found"


@pytest.mark.asyncio(loop_scope="session")
async def test_get_entity_custom_not_found_detail(
    db_session: AsyncSession,
) -> None:
    with pytest.raises(HTTPException) as exc_info:
        await get_entity(
            db_session,
            Organization,
            id=uuid4(),
            not_found_detail="Organization not found",
        )
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Organization not found"


@pytest.mark.asyncio(loop_scope="session")
async def test_get_entity_requires_filters(db_session: AsyncSession) -> None:
    with pytest.raises(ValueError, match="at least one filter"):
        await get_entity(db_session, Organization)
