from typing import Annotated

from fastapi import Depends, Request

from app.lib.event_dispatcher import EventDispatcher


def get_event_dispatcher(request: Request) -> EventDispatcher:
    return request.app.state.dispatcher


EventDispatcherDep = Annotated[EventDispatcher, Depends(get_event_dispatcher)]
