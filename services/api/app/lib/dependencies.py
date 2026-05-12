from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.lib.event_dispatcher import EventDispatcher
from app.lib.post_commit import PostCommitQueue, get_or_init_post_commit_queue


def get_event_dispatcher(request: Request) -> EventDispatcher:
    return request.app.state.dispatcher


def get_post_commit_queue(request: Request) -> PostCommitQueue:
    return get_or_init_post_commit_queue(request)


EventDispatcherDep = Annotated[EventDispatcher, Depends(get_event_dispatcher)]

PostCommitDep = Annotated[PostCommitQueue, Depends(get_post_commit_queue)]

SessionDep = Annotated[AsyncSession, Depends(get_session)]
