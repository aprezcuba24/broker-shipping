# Broker API

FastAPI + SQLModel + Alembic. Entidades en `app/models/{dominio}/` (carpeta obligatoria por dominio).

## Desarrollo

```bash
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Migraciones

Requisito: Postgres accesible (variables `POSTGRES_*` en el `.env` de la raíz del monorepo).

```bash
uv run alembic upgrade head
uv run alembic revision --autogenerate -m "descripcion del cambio"
uv run alembic current
uv run alembic history
```

Revisa siempre el fichero en `alembic/versions/` antes de commitear.

## Reset + seeds

Desde la raíz del monorepo (destruye datos en `POSTGRES_DB`, reaplica migraciones y seeds):

```bash
pnpm db:reset
```

Seed demo: usuario `provider@example.com` / `password123`, org **Demo Provider**, producto **Producto demo**.
Nuevos seeds: añadir un módulo en `scripts/seed/` y registrarlo en `scripts/seed/runner.py`.
