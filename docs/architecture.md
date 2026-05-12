# Arquitectura actual (scaffold)

Visión de alto nivel del monorepo **Broker B2B** en su estado actual: aplicaciones, tecnologías y cómo se enlazan. No incluye dominio de negocio ni despliegue en producción.

## Monorepo

Un solo repositorio agrupa **tres aplicaciones de cliente** (Node/pnpm), **un servicio API** (Python/uv) y **definición de infraestructura local** (Docker Compose). El contrato entre clientes y backend será **HTTP** hacia la API REST (OpenAPI en `/docs` del servicio).

## Aplicaciones

| Pieza | Carpeta | Rol |
|--------|---------|-----|
| Portal proveedores | `apps/backoffice` | SPA para empresas que publican catálogo (nombre de carpeta acordado en el proyecto; en el PRD es “portal para proveedores”). |
| Administración | `apps/admin` | SPA para operación global (equivalente al “backoffice administrativo” del PRD). |
| Vendedores | `apps/seller-apk` | Misma base web que las anteriores; además **Capacitor** empaqueta el build estático para **Android** (APK/AAB vía proyecto `android/`). |
| API | `services/api` | **FastAPI**: punto único de verdad para datos y reglas cuando se implementen; hoy es scaffold con salud básica y OpenAPI. |

Todas las SPAs comparten enfoque: **Vite**, **React**, **TypeScript**, **TanStack Query**, **TanStack Router**, **Zustand** y **Tailwind CSS v4**.

## Tecnologías clave

- **Frontends:** pnpm workspaces, Vite, React 19, TanStack (query + router), Zustand, Tailwind.
- **Móvil:** Capacitor 8 sobre el artefacto web (`dist`).
- **Backend:** Python 3.12+, [uv](https://docs.astral.sh/uv/) (dependencias y entorno), FastAPI, Uvicorn, Pydantic / pydantic-settings, SQLModel, Alembic; cliente **Redis** async; **boto3** para S3; dependencias declaradas alineadas al PRD (**arq**, etc.) sin colas activas aún.
- **Datos y servicios locales (Docker):** PostgreSQL, Redis, MinIO (API compatible S3 para desarrollo; en producción puede sustituirse por **AWS S3** con la misma idea de cliente).

## Relaciones

- Los **tres clientes** consumirán la **misma API** (URLs y auth pendientes de definir).
- La **API** persistirá en **PostgreSQL** (vía SQLModel + migraciones Alembic cuando existan modelos), usará **Redis** para caché/colas en evolución, y **objetos en almacenamiento tipo S3** (MinIO local o bucket AWS).
- **Docker Compose** no ejecuta la API ni los frontends; solo **Postgres, Redis y MinIO** para desarrollo local.

## Diagrama de componentes

```mermaid
flowchart TB
  subgraph clients [Aplicaciones cliente]
    BO[backoffice]
    AD[admin]
    SE[seller-apk]
  end

  subgraph monorepo [Monorepo]
    API[API FastAPI]
  end

  subgraph docker [Docker Compose]
    PG[(PostgreSQL)]
    RD[(Redis)]
    S3[MinIO compatible S3]
  end

  BO -->|HTTPS futuro| API
  AD -->|HTTPS futuro| API
  SE -->|HTTPS futuro| API

  API --> PG
  API --> RD
  API --> S3
```

En este diagrama, **seller-apk** es a la vez cliente web (Vite) y contenedor nativo Android cuando se sincroniza con Capacitor; la relación lógica con el backend es la misma que las otras SPAs.

## Capas de la API

Cada módulo de dominio (`app/modules/<dominio>/`) sigue esta estructura:

```
modules/<dominio>/
  models/           ← SQLModel(table=True)
  repositories/     ← hereda de Resource[T]  (app/lib/resource.py)
  services/         ← hereda de BaseService[T]  (app/lib/base_service.py)
  events.py         ← hereda de EntityEvent[T]  (app/lib/event_base.py)
  listener.py       ← suscripciones al EventDispatcher
  routes.py         ← endpoints delegan al servicio
  deps.py           ← make_service_depends → ServiceDep
```

### Clases base genéricas (`app/lib/`)

| Clase | Archivo | Qué resuelve |
|-------|---------|--------------|
| `Resource[T]` | `resource.py` | CRUD async sobre `AsyncSession`. Los repositorios heredan sin repetir código. |
| `BaseService[T]` | `base_service.py` | CRUD que delega al `Resource`, con hooks `on_create`, `on_update`, `on_delete`, `on_get`, `on_list`. |
| `EntityEvent[T]` | `event_base.py` | Evento con campo `entity: T` tipado. |
| `PostCommitQueue` | `post_commit.py` | Cola por request; se drena solo tras `session.commit()` exitoso. |
| `make_service_depends` | `db_utils.py` | Fábrica genérica de `Depends` que construye repo + servicio por petición. |

```mermaid
flowchart LR
  R[routes.py] --> S[BaseService]
  S --> Rep[Resource]
  Rep --> Ses[AsyncSession]
  S -.->|"post_commit_emit"| Q[PostCommitQueue]
  Ses -.->|"commit OK"| Q
  Q --> Bus[EventDispatcher]
```

### Eventos de dominio (post-commit)

Los eventos se ejecutan **solo después de un commit exitoso**. El servicio llama `self.post_commit_emit(event)` dentro de un hook `on_*`; la cola se drena tras `session.commit()`. En rollback se descarta. Si un handler falla post-commit, se registra en log sin afectar la respuesta HTTP.

Las clases de evento heredan de `EntityEvent[T]` y se definen **bajo demanda** en `events.py`. Ver `app/modules/products/events.py` (`ProductCreated`) como ejemplo.

## Referencias

- Producto y roadmap: [PRD B2B](prd_broker_b2b.md).
- Comandos y variables de entorno: [README de la raíz](../README.md).
