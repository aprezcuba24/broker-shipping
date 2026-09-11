# Broker B2B — monorepo (scaffold)

Plataforma API-first: **FastAPI** + **PostgreSQL** / **Redis** / **S3** (MinIO local o AWS), tres frontends **Vite + React + TypeScript** ([TanStack Query](https://tanstack.com/query/latest), [React Router](https://reactrouter.com/), **Zustand**, **Tailwind CSS v4**), landing **Astro**, paquetes compartidos `@broker/api` y `@broker/ui`.

| Ruta | Descripción |
|------|-------------|
| [`apps/backoffice`](apps/backoffice) | Portal **proveedores** |
| [`apps/admin`](apps/admin) | **Administración** global |
| [`apps/seller`](apps/seller) | Portal **vendedores** |
| [`apps/landing`](apps/landing) | Landing de **prelanzamiento** (Astro) |
| [`services/api`](services/api) | API **FastAPI** ([uv](https://docs.astral.sh/uv/) para dependencias) |

## Requisitos

- **Node** 20+ y [pnpm](https://pnpm.io/)
- **uv** ([instalación](https://docs.astral.sh/uv/getting-started/installation/)) — el ejecutable suele estar en `~/.local/bin` si instalaste con pipx
- **Docker** (Compose) para Postgres, Redis y MinIO

## Infra local

```bash
docker compose up -d
```

Copia [`.env.example`](.env.example) a `.env` en la **raíz del monorepo** (junto a `docker-compose.yml`).

- **API → Postgres:** solo `DATABASE_URL` (p. ej. `postgresql://broker:broker@localhost:6432/broker`).
- **Compose → contenedor Postgres:** `POSTGRES_USER` / `PASSWORD` / `DB` / `PORT` (la API no las lee).
- **Redis:** `REDIS_HOST` / `REDIS_PORT`.
- **MinIO:** API `MINIO_API_PORT`, consola `MINIO_CONSOLE_PORT`, credenciales `MINIO_ROOT_*`.

## Instalar dependencias Node

En la raíz del repo:

```bash
pnpm install
```

## Desarrollo

| Comando | Descripción |
|---------|-------------|
| `pnpm dev:backoffice` | Portal proveedores (Vite) |
| `pnpm dev:admin` | Admin (Vite) |
| `pnpm dev:seller` | Portal vendedores (Vite) |
| `pnpm dev:landing` | Landing prelanzamiento (Astro, puerto 5176) |
| `pnpm dev:api` | API FastAPI (`uvicorn` vía `uv run`) |

**API (desde `services/api`):**

```bash
cd services/api
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Documentación con la API en marcha: **Swagger** (`http://localhost:8000/docs`), **ReDoc** (`http://localhost:8000/redoc`), y el esquema **OpenAPI en JSON** en `http://localhost:8000/openapi.json` (p. ej. `curl -s http://localhost:8000/openapi.json` o importar en Postman / generadores de cliente).

## Migraciones de base de datos (Alembic)

Con Postgres levantado (`docker compose up -d`), desde `services/api`:

```bash
cd services/api
uv sync
uv run alembic upgrade head              # aplicar migraciones
uv run alembic revision --autogenerate -m "descripcion"  # nueva revisión
uv run alembic current                   # revisión aplicada
uv run alembic history                   # historial
```

Las entidades SQLModel viven en `app/models/{dominio}/` (carpeta obligatoria por dominio). Revisa siempre el fichero generado en `alembic/versions/` antes de commitear.

## S3 / MinIO / AWS

En desarrollo puedes apuntar `AWS_ENDPOINT_URL` a MinIO (el host/puerto debe coincidir con `MINIO_API_PORT`, p. ej. `http://localhost:9000`) y alinear `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` con `MINIO_ROOT_*`. En producción con **AWS S3**, deja `AWS_ENDPOINT_URL` vacío y configura bucket y credenciales IAM.

## Producción (Railway + AWS + Cloudflare)

Guía completa (DNS, Workers static assets, S3, SES, variables): [`docs/deploy_railway.md`](docs/deploy_railway.md).

## Construir todos los frontends

```bash
pnpm build
```
