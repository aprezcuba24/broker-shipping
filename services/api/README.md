# broker-api

FastAPI service. Use [uv](https://docs.astral.sh/uv/) from this directory: `uv sync`, `uv run uvicorn app.main:app --reload`.

## Documentación interactiva

Con la API levantada en `localhost` y puerto **8000** (por ejemplo `pnpm dev:api` desde la raíz del monorepo o `uvicorn … --port 8000`):

| Ruta | Herramienta |
|------|-------------|
| [`http://localhost:8000/docs`](http://localhost:8000/docs) | **Swagger UI** |
| [`http://localhost:8000/redoc`](http://localhost:8000/redoc) | **ReDoc** |
| [`http://localhost:8000/openapi.json`](http://localhost:8000/openapi.json) | **OpenAPI** (documento JSON; clientes codegen, CI, proxies) |

Ejemplo rápido: `curl -s http://localhost:8000/openapi.json | head`.

## Configuración

Toda la configuración local compartida vive en el `.env` de la **raíz del monorepo** (mismo fichero que usa Docker Compose). La clase [`app/config.py`](app/config.py) construye `database_url`, `database_url_sync` y `redis_url` a partir de `POSTGRES_*`, `REDIS_*`, etc.

## Migraciones (globales)

Todas las tablas se registran en un único `SQLModel.metadata`. Los modelos se descubren mediante `get_app_modules()` en [app/modules/__init__.py](app/modules/__init__.py): cada `AppModule` declara sus tablas con `get_models()`, y [alembic/env.py](alembic/env.py) carga ese inventario antes de autogenerar o aplicar revisiones. Los scripts viven en un solo árbol: [alembic/versions/](alembic/versions/).

Desde el directorio `services/api`:

1. **Aplicar migraciones** (crear/actualizar tablas hasta la última revisión):

   ```bash
   uv run alembic upgrade head
   ```

2. **Generar una nueva revisión** (comparar el modelo en código con la base definida en `.env`):

   ```bash
   uv run alembic revision --autogenerate -m "descripcion del cambio"
   ```

   Revisa siempre el fichero generado en `alembic/versions/` antes de commitear (Alembic puede proponer renombres, drops u otros cambios no deseados).

3. **Comandos útiles:**

   ```bash
   uv run alembic current
   uv run alembic history
   ```

Si no tienes Postgres accesible, no podrás usar `--autogenerate` hasta tener una base con la URL correcta; en ese caso puedes añadir migraciones escritas a mano siguiendo el estilo de las revisiones existentes en `alembic/versions/`.

## Pruebas automáticas (pytest)

Las pruebas usan **PostgreSQL** en una base **distinta** a la de desarrollo (por defecto `broker_test`). No levantan Docker ni ejecutan Alembic; asumen Postgres ya accesible y la base de test ya creada.

1. Levanta Postgres (por ejemplo con el compose de la raíz del monorepo) y crea la base de test una vez (ajusta usuario y base inicial a lo definido en tu `.env`):

   ```bash
   docker compose up -d postgres
   docker compose exec postgres -- psql -U broker -d broker -c "CREATE DATABASE broker_test;"
   ```

2. Instala dependencias de desarrollo y ejecuta pytest desde `services/api`:

   ```bash
   uv sync --extra dev
   uv run pytest
   ```

   Desde la raíz del monorepo también puedes usar: `pnpm test:api`.

3. **Base de datos de test:** [`tests/conftest.py`](tests/conftest.py) fija `POSTGRES_DB` al valor de `POSTGRES_DB_TEST` (por defecto `broker_test`) antes de importar la app; el resto de `POSTGRES_*` y Redis salen del `.env` de la raíz.

Al inicio de la sesión de tests se recrea el esquema con `SQLModel.metadata` (`drop_all` / `create_all`); antes de cada caso se hace `TRUNCATE` de las tablas de dominio para un estado vacío conocido.
