---
name: broker-api-development
description: >-
  FastAPI backend in services/api: domain modules, SQLModel, Resource/BaseService,
  org-scoped mixins, DishkaRoute, events/listeners, JWT + API keys, Alembic, pytest.
  Use when adding modules, routes, services, repositories, migrations, or tests.
---

# Broker API Development

**Canonical reference:** `services/api/app/modules/products/` (global + tenant CRUD, events, tests).

**Flow:** `@require_*` → route (`DishkaRoute`) → `BaseService` → `Resource` → `AsyncSession`. Events via `post_commit_emit` → drained after commit in `app/lib/providers.py`. Listeners run in a fresh REQUEST scope.

---

## Module layout

```
app/modules/foo/
├── module.py          # AppModule: prefix, router, listeners, MODULE_MODELS, Provider
├── provider.py        # Dishka REQUEST scope
├── events.py / listener.py
├── models/foo.py
├── repositories/foo_repository.py
├── services/foo_service.py
└── routes/foo.py + __init__.py
```

Register `FooModule()` in `get_app_modules()` (`app/modules/__init__.py`). **Do not** eager-import modules from `app/modules/foo/__init__.py` (avoids cycles with `app.lib.security`). Tenancy glue (`UserOrganization`, `ApiKey`) lives in `organization/`.

---

## Models

| Base | Use for | Repo | Service |
|------|---------|------|---------|
| `EntityModel` | Global CRUD (`Organization`, …) | `Resource[T]` | `BaseService[T]` |
| `OrganizationEntityModel` | Tenant-scoped (`Product`, `Category`, …) | `OrgScopedRepositoryMixin[T]` | `OrgScopedServiceMixin[T], BaseService[T]` |
| Custom fields | `User`, `ApiKey`, `UserOrganization` | `Resource[T]` or custom | `BaseService[T]` |

All from `app.lib.persistence`. Subclasses declare **domain fields only** — inherit `id`, timestamps, `IMMUTABLE_FIELDS` (org mixin adds `organization_id` as immutable).

Rules:
- `utc_now()` for all timestamps (naive UTC).
- Never accept `updated_at` from client; `BaseService.patch` sets it.
- Export `MODULE_MODELS` from `models/__init__.py`.

---

## Multi-tenant (organization-scoped)

Reference: `app/modules/products/routes/category.py`, `CategoryService`, `CategoryRepository`.

**Tenant resolution** — `organization_id_for(principal)` (`app/lib/security`):
- `ApiKeyPrincipal` → org from key row (header `X-API-Key` only).
- `UserPrincipal` → header `X-Organization-Id`, validated via `UserOrganizationRepository.is_member` (403 if not member). Required on tenant routes via `@require_user_or_api_key`.

**Never set `organization_id` from request body on create** — always from principal.

| Operation | Service method |
|-----------|----------------|
| List | `list_for_organization(oid)` |
| Get | `get_or_404_for_organization(id, oid, detail=…)` |
| Create | `create(entity)` with `organization_id=oid` on entity |
| Patch / delete | `get_or_404_for_organization` first, then `patch` / `delete` |

Repo filters (`list_by_organization`, `get_by_id_for_organization`) live in `OrgScopedRepositoryMixin` — not in routes/services.

Route pattern: `@require_user_or_api_key`, `principal: Principal` **last**, `oid = organization_id_for(principal)`.

**Tests:** `tenant_headers(user_id, organization_id)` or `api_key_headers(raw_key)`. Factory must accept `organization_id`. Add cross-org isolation + API-key scope tests (see `tests/products/test_category_routes.py`).

---

## Repository & service

- Custom SQL (filters, joins) → **repository only**, never route.
- Global repo methods: `list_all`, `get_by_id`, `create`, `update`, `delete`.
- Service: implement `creation_exclude()` → `Model.IMMUTABLE_FIELDS`, `patch_allowed_keys()` → `model_fields - IMMUTABLE_FIELDS`.
- Override hooks: `on_create`, `on_update`, `on_delete`, `on_get`, `on_list`. Emit with `post_commit_emit(Event(...))` in `on_create` etc.
- **Do not override `BaseService.patch`.**
- No events → omit `dispatcher` / `post_commit` from provider (see `OrganizationProvider`).

---

## Routes

- `APIRouter(route_class=DishkaRoute)`; inject deps with `FromDishka[...]`.
- Global CRUD: `service.list()`, `get_or_404`, `create`, `patch`, `delete`.
- PATCH body: `dict[str, Any]` + `allowed_keys=Service.patch_allowed_keys()`.
- POST: `Model(**body.model_dump(exclude=Service.creation_exclude()))`.

**Auth** (`app.lib.security`):
- JWT: `Authorization: Bearer …` (AuthX; login under `/users/`).
- API key: `X-API-Key: bk_<prefix>_<secret>` — store hash + prefix only; never log raw keys.
- Decorators **below** `@router.*`, **above** handler. Params without defaults before `principal`.

---

## Events & listeners

```python
class FooCreated(EntityEvent[Foo]): ...
def register_listeners(d): d.subscribe(FooCreated, _handler)
```

`EntityEvent[Model]` for entity payload; bare `Event` otherwise. Module events in `events.py`; cross-cutting in `app/events/`. Handlers idempotent; exceptions logged by dispatcher.

---

## Provider

```python
class FooProvider(Provider):
    scope = Scope.REQUEST
    @provide
    def foo_repository(self, session: AsyncSession) -> FooRepository: ...
    @provide
    def foo_service(self, repo, dispatcher, post_commit) -> FooService: ...
```

---

## Migrations & tests

```bash
cd services/api
uv run alembic revision --autogenerate -m "add foo table"  # review before commit
uv run alembic upgrade head
uv run pytest   # or pnpm test:api from root
```

- Single `SQLModel.metadata`; `load_module_models()` at migration time.
- Test DB: `broker_test` via `POSTGRES_DB_TEST`; truncate tables in `conftest.py` before each test; factory commits so HTTP client sees rows.
- New table → add to `TRUNCATE` + `foo_factory` fixture.

Auth test helpers: `tests/factories/auth_helpers.py` — `bearer_headers`, `tenant_headers`, `api_key_headers`.

---

## Config (`.env` at monorepo root)

| Variable | Purpose |
|----------|---------|
| `POSTGRES_*` | DB connection |
| `POSTGRES_DB_TEST` | Test DB (default `broker_test`) |
| `REDIS_*` | Redis |
| `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `JWT_ACCESS_TOKEN_MINUTES` | AuthX tokens |

Do not hardcode URLs.

---

## Conventions

- Routes → service only, never repository.
- One module = one URL prefix (`register_modules`).
- Org-scoped: mixins + `organization_id_for`; never trust client `organization_id`.
- Use `post_commit_emit`, not `dispatcher.emit` directly.

## New module checklist

- [ ] Tree under `app/modules/foo/` + `FooModule()` in `get_app_modules()`
- [ ] Model: `EntityModel` or `OrganizationEntityModel`; export `MODULE_MODELS`
- [ ] Repository + service (global or org mixins); `creation_exclude` / `patch_allowed_keys`
- [ ] Routes with auth; org-scoped → `organization_id_for(principal)`
- [ ] Events/listener/provider (skip dispatcher if no events)
- [ ] Alembic revision + `upgrade head`
- [ ] Factory, TRUNCATE entry, fixtures, route tests (+ tenant isolation if org-scoped)
