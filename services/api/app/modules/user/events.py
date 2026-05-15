from app.lib.event_base import EntityEvent
from app.modules.user.models import User


class UserCreated(EntityEvent[User]):
    """Emitted after a new User row is committed."""
