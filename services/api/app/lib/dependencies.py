from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.lib.event_dispatcher import EventDispatcher


def get_event_dispatcher(request: Request) -> EventDispatcher:
    return request.app.state.dispatcher


EventDispatcherDep = Annotated[EventDispatcher, Depends(get_event_dispatcher)]

SessionDep = Annotated[AsyncSession, Depends(get_session)]
