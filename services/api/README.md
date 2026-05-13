# broker-api

FastAPI service. Use [uv](https://docs.astral.sh/uv/) from this directory: `uv sync`, `uv run uvicorn app.main:app --reload`.

## Configuración de base de datos

- **Aplicación (async):** la variable `database_url` en [app/config.py](app/config.py) por defecto usa el driver async `postgresql+asyncpg://…` (también configurable vía entorno / `.env`).
- **Alembic (sync):** las migraciones usan un URL **síncrono** con `psycopg2`, por ejemplo `postgresql://usuario:clave@host:5432/nombre_db`. Establece `DATABASE_URL_SYNC` para apuntar a la misma base que usará la API, con el esquema `postgresql://` (sin `+asyncpg`).

## Migraciones (globales)

Todas las tablas se registran en un único `SQLModel.metadata`. Los modelos se descubren mediante `get_app_modules()` en [app/modules/__init__.py](app/modules/__init__.py): cada `AppModule` declara sus tablas con `get_models()`, y [alembic/env.py](alembic/env.py) carga ese inventario antes de autogenerar o aplicar revisiones. Los scripts viven en un solo árbol: [alembic/versions/](alembic/versions/).

Desde el directorio `services/api`:

1. **Aplicar migraciones** (crear/actualizar tablas hasta la última revisión):

   ```bash
   DATABASE_URL_SYNC=postgresql://usuario:clave@localhost:5432/broker uv run alembic upgrade head
   ```

2. **Generar una nueva revisión** (comparar el modelo en código con la base conectada por `DATABASE_URL_SYNC`):

   ```bash
   DATABASE_URL_SYNC=postgresql://usuario:clave@localhost:5432/broker uv run alembic revision --autogenerate -m "descripcion del cambio"
   ```

   Revisa siempre el fichero generado en `alembic/versions/` antes de commitear (Alembic puede proponer renombres, drops u otros cambios no deseados).

3. **Comandos útiles:**

   ```bash
   uv run alembic current
   uv run alembic history
   ```

Si no tienes Postgres accesible, no podrás usar `--autogenerate` hasta tener una base con la URL correcta; en ese caso puedes añadir migraciones escritas a mano siguiendo el estilo de las revisiones existentes en `alembic/versions/`.

## Pruebas automáticas (pytest)

Las pruebas usan **PostgreSQL** en una base **distinta** a la de desarrollo (`broker` vs `broker_test`). No levantan Docker ni ejecutan Alembic; asumen Postgres ya accesible y la base de test ya creada.

1. Levanta Postgres (por ejemplo con el compose de la raíz del monorepo) y crea la base de test una vez:

   ```bash
   docker compose up -d postgres
   docker compose exec postgres psql -U broker -d broker -c "CREATE DATABASE broker_test;"
   ```

2. Instala dependencias de desarrollo y ejecuta pytest desde `services/api`:

   ```bash
   uv sync --extra dev
   uv run pytest
   ```

   Desde la raíz del monorepo también puedes usar: `pnpm test:api`.

3. **URL de base de datos:** por defecto las pruebas usan `postgresql+asyncpg://broker:broker@localhost:5432/broker_test` (véase `tests/conftest.py`). Para otro host o nombre de base, exporta `DATABASE_URL` antes de lanzar pytest.

Al inicio de la sesión de tests se recrea el esquema con `SQLModel.metadata` (`drop_all` / `create_all`); antes de cada caso se hace `TRUNCATE` de las tablas de dominio para un estado vacío conocido.
