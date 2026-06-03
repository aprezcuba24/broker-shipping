from fastapi import Request
from pydantic import ConfigDict

from app.lib.event_base import EntityEvent
from app.modules.user.models import User


class UserCreated(EntityEvent[User]):
    """Emitted after a new User row is committed."""


class UserLoginAttempt(EntityEvent[User]):
    """Emitted after password verification; gate listeners may veto login."""

    model_config = ConfigDict(arbitrary_types_allowed=True)
    request: Request
