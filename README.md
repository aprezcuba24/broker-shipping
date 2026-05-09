# Broker B2B — monorepo (scaffold)

Plataforma API-first: **FastAPI** + **PostgreSQL** / **Redis** / **S3** (MinIO local o AWS), tres frontends **Vite + React + TypeScript** ([TanStack Query](https://tanstack.com/query/latest), [TanStack Router](https://tanstack.com/router/latest), **Zustand**, **Tailwind CSS v4**), y **Capacitor** para Android (`seller-apk`).

| Ruta | Descripción |
|------|-------------|
| [`apps/backoffice`](apps/backoffice) | Portal **proveedores** |
| [`apps/admin`](apps/admin) | **Administración** global |
| [`apps/seller-apk`](apps/seller-apk) | App **vendedores** (web + Capacitor Android) |
| [`services/api`](services/api) | API **FastAPI** ([uv](https://docs.astral.sh/uv/) para dependencias) |

## Requisitos

- **Node** 20+ y [pnpm](https://pnpm.io/)
- **uv** ([instalación](https://docs.astral.sh/uv/getting-started/installation/)) — el ejecutable suele estar en `~/.local/bin` si instalaste con pipx
- **Docker** (Compose) para Postgres, Redis y MinIO

## Infra local

```bash
docker compose up -d
```

Copia [`.env.example`](.env.example) a `.env` en la raíz (o en `services/api`) y ajusta URLs si cambias puertos.

- Postgres: `localhost:5432` (usuario/clave/db `broker` por defecto en Compose)
- Redis: `localhost:6379`
- MinIO API: `localhost:9000`, consola: `localhost:9001` (usuario/clave por defecto `minio` / `minio_secret`)

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
| `pnpm dev:seller-apk` | Vendedores web (Vite; mismo código que luego empaqueta Capacitor) |
| `pnpm dev:api` | API FastAPI (`uvicorn` vía `uv run`) |

**API (desde `services/api`):**

```bash
cd services/api
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Migraciones (Alembic):** definir `DATABASE_URL_SYNC` (driver sync, p. ej. `postgresql://broker:broker@localhost:5432/broker`) y ejecutar `uv run alembic upgrade head` dentro de `services/api`.

## S3 / MinIO / AWS

En desarrollo puedes apuntar `AWS_ENDPOINT_URL` a MinIO (p. ej. `http://localhost:9000`) y usar las mismas variables que en `.env.example`. En producción con **AWS S3**, deja `AWS_ENDPOINT_URL` vacío y configura bucket y credenciales IAM.

Cliente mínimo en el código: [`services/api/app/s3_util.py`](services/api/app/s3_util.py).

## APK Android (`seller-apk`)

Tras un build web reciente:

```bash
cd apps/seller-apk
pnpm android:sync
```

Abre la carpeta `android` en Android Studio y genera el APK o AAB desde Gradle. El proyecto nativo ya se añadió con `cap add android`.

## Construir todos los frontends

```bash
pnpm build
```
