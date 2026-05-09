# broker-api

FastAPI service. Use [uv](https://docs.astral.sh/uv/) from this directory: `uv sync`, `uv run uvicorn app.main:app --reload`.

Migrations: set `DATABASE_URL_SYNC` (sync driver, e.g. `postgresql://…`) and run `uv run alembic upgrade head`.
