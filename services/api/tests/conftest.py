"""Pytest configuration: Postgres test DB, schema DDL, ASGI client."""

from __future__ import annotations

import os
from collections.abc import AsyncIterator

# Instantiate Settings with the test database URL (before app imports).
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://broker:broker@localhost:5432/broker_test",
)

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlmodel import SQLModel

from app.db.model_loader import load_module_models
from app.main import app, lifespan
from tests.factories.product_factory import ProductFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


@pytest_asyncio.fixture(scope="session")
async def test_engine() -> AsyncIterator[AsyncEngine]:
    load_module_models()
    from app.config import settings

    engine = create_async_engine(settings.database_url)
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
        await conn.run_sync(SQLModel.metadata.create_all)
    try:
        yield engine
    finally:
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.drop_all)
        await engine.dispose()


@pytest_asyncio.fixture(scope="session")
async def client(test_engine: AsyncEngine) -> AsyncIterator[AsyncClient]:
    async with lifespan(app):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as ac:
            yield ac


@pytest_asyncio.fixture(autouse=True)
async def _truncate_tables(test_engine: AsyncEngine) -> AsyncIterator[None]:
    async with test_engine.begin() as conn:
        await conn.execute(
            text("TRUNCATE TABLE product, organization RESTART IDENTITY CASCADE")
        )
    yield


@pytest_asyncio.fixture
async def db_session(test_engine: AsyncEngine) -> AsyncIterator[AsyncSession]:
    session_maker = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    async with session_maker() as session:
        yield session


@pytest_asyncio.fixture
async def product_factory(db_session: AsyncSession) -> ProductFactory:
    return ProductFactory(db_session)
