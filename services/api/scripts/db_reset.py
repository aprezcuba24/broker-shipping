"""Reset the database, run migrations, and apply modular seeds.

Usage (from repo root):
  pnpm db:reset

Or from services/api:
  uv run python scripts/db_reset.py
"""

from __future__ import annotations

import asyncio
import subprocess
import sys
from pathlib import Path
from urllib.parse import urlparse

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from app.config import settings  # noqa: E402
from app.db.session import create_async_engine_and_session_maker  # noqa: E402
from scripts.seed.runner import run_all  # noqa: E402


def reset_schema() -> None:
    """Drop and recreate the public schema on DATABASE_URL."""
    conn = psycopg2.connect(settings.database_url_sync)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT pg_terminate_backend(pid)
                FROM pg_stat_activity
                WHERE datname = current_database()
                  AND pid <> pg_backend_pid()
                """
            )
            cur.execute("DROP SCHEMA public CASCADE")
            cur.execute("CREATE SCHEMA public")
            cur.execute("GRANT ALL ON SCHEMA public TO CURRENT_USER")
            cur.execute("GRANT ALL ON SCHEMA public TO public")
        print(f"Reset schema on database {urlparse(settings.database_url_sync).path.lstrip('/')!r}.")
    finally:
        conn.close()


def run_migrations() -> None:
    result = subprocess.run(
        ["uv", "run", "alembic", "upgrade", "head"],
        cwd=_ROOT,
        check=False,
    )
    if result.returncode != 0:
        raise SystemExit(f"alembic upgrade head failed with exit code {result.returncode}")
    print("Migrations applied (alembic upgrade head).")


async def run_seeds() -> None:
    engine, session_maker = create_async_engine_and_session_maker(settings.database_url)
    try:
        async with session_maker() as session:
            await run_all(session)
    finally:
        await engine.dispose()


def main() -> None:
    print("=== DB reset ===", flush=True)
    reset_schema()
    print("=== Migrations ===", flush=True)
    run_migrations()
    print("=== Seeds ===", flush=True)
    asyncio.run(run_seeds())
    print("Done.", flush=True)


if __name__ == "__main__":
    main()
