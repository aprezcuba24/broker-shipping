from sqlalchemy import select

from app.lib.persistence import Resource
from app.modules.user.models import User


class UserRepository(Resource[User]):
    async def get_by_username(self, username: str) -> User | None:
        result = await self._session.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()
