"""Create or promote a super admin user.

Usage:
  cd services/api
  uv run python scripts/create_super_admin.py \\
    --email admin@example.com \\
    --name "Super Admin" \\
    --password "SecurePass123!"

  # Elevate an existing user by email:
  uv run python scripts/create_super_admin.py \\
    --email existing@example.com \\
    --promote
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

# Allow `uv run python scripts/create_super_admin.py` from services/api
_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from sqlmodel import select

from app.config import settings
from app.db.session import create_async_engine_and_session_maker
from app.lib.security.passwords import hash_password
from app.lib.utils import utc_now
from app.models.user.user import User


def _normalize_email(email: str) -> str:
    return email.strip().lower()


async def create_super_admin(
    *,
    email: str,
    name: str,
    password: str,
) -> User:
    engine, session_maker = create_async_engine_and_session_maker(settings.database_url)
    try:
        async with session_maker() as session:
            existing = await session.execute(select(User).where(User.email == email))
            if existing.scalar_one_or_none() is not None:
                raise SystemExit(
                    f"User with email {email!r} already exists. "
                    "Use --promote to elevate them."
                )
            user = User(
                name=name.strip(),
                email=email,
                password_hash=hash_password(password),
                is_super_admin=True,
                email_verified_at=utc_now(),
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            return user
    finally:
        await engine.dispose()


async def promote_super_admin(*, email: str) -> User:
    engine, session_maker = create_async_engine_and_session_maker(settings.database_url)
    try:
        async with session_maker() as session:
            result = await session.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()
            if user is None:
                raise SystemExit(f"No user found with email {email!r}.")
            if user.is_super_admin:
                print(f"User {email!r} is already a super admin (id={user.id}).")
                return user
            user.is_super_admin = True
            session.add(user)
            await session.commit()
            await session.refresh(user)
            return user
    finally:
        await engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Create a new super admin or promote an existing user.",
    )
    parser.add_argument("--email", required=True, help="User email (normalized to lower).")
    parser.add_argument(
        "--name",
        default=None,
        help="Display name (required when creating, ignored with --promote).",
    )
    parser.add_argument(
        "--password",
        default=None,
        help="Password (required when creating, min 8 chars).",
    )
    parser.add_argument(
        "--promote",
        action="store_true",
        help="Elevate an existing user to super admin by email.",
    )
    args = parser.parse_args()
    email = _normalize_email(args.email)

    if args.promote:
        user = asyncio.run(promote_super_admin(email=email))
        print(f"Promoted super admin: {user.email} (id={user.id})")
        return

    if not args.name or not args.name.strip():
        parser.error("--name is required when creating a super admin")
    if not args.password:
        parser.error("--password is required when creating a super admin")
    if len(args.password) < 8:
        parser.error("--password must be at least 8 characters")

    user = asyncio.run(
        create_super_admin(
            email=email,
            name=args.name,
            password=args.password,
        )
    )
    print(f"Created super admin: {user.email} (id={user.id})")


if __name__ == "__main__":
    main()
