from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.lib.utils import utc_now
from app.lib.security.passwords import hash_password

async def run(session: AsyncSession) -> None:
    user = User(
        name="Admin",
        email="admin@example.com",
        password_hash=hash_password("admin"),
        is_super_admin=True,
        email_verified_at=utc_now(),
    )
    session.add(user)
    await session.flush()