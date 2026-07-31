"""Shared FastAPI dependencies."""

from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession


async def get_db(request: Request) -> AsyncIterator[AsyncSession]:
    session_maker = request.app.state.session_maker
    async with session_maker() as session:
        yield session


SessionDep = Annotated[AsyncSession, Depends(get_db)]
