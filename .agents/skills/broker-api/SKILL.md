---
name: broker-api
description: >-
  Develop features in services/api (FastAPI + SQLModel + Alembic): models, schemas,
  services, routes, multi-tenant auth with organization_id query param, provider/seller
  scoping, migrations, and pytest. Use when adding or changing API endpoints, domain
  entities, auth/tenant deps, or backend tests on the new-backend scaffold.
---

# Broker API (new-backend)

**Canonical reference (provider CRUD):** `app/routes/products_provider.py` + `app/services/product.py`

**Canonical reference (seller read):** `app/routes/products_seller.py` + `app/services/seller_product.py`

**Canonical reference (auth/tenant):** `app/lib/security/deps.py` + `app/lib/security/access.py`

Stack: FastAPI, SQLModel, Alembic, async SQLAlchemy (`asyncpg`), Pydantic, JWT (PyJWT), bcrypt. Package manager: **uv**. Root of service: `services/api/`.

Do **not** port Dishka modules, `X-Organization-Id` headers, or the old `app/modules/` layout from `main` unless the user explicitly asks.

---

## Layout

```
services/api/app/
├── main.py                 # FastAPI app + lifespan (engine/session)
├── config.py               # Settings / DB URL / JWT
├── deps.py                 # get_db
├── models/{domain}/        # SQLModel tables + DOMAIN_MODELS
├── schemas/                # Pydantic request/response DTOs
├── services/               # Business logic (async functions)
├── routes/                 # Thin FastAPI routers
└── lib/
    ├── persistence/        # EntityModel, OrganizationEntityModel, apply_partial_update
    ├── security/           # JWT, passwords, access, Depends aliases
    └── utils.py            # utc_now
```

Tests: `services/api/tests/` (pytest + httpx AsyncClient + factories).

---

## Layering rules

| Layer | Responsibility | Does NOT |
|-------|----------------|----------|
| **Model** | Table shape, FKs, indexes | HTTP, validation messages for API |
| **Schema** | Input/output validation (Pydantic) | DB sessions, queries |
| **Service** | Queries, rules, commits | `Depends`, request/response models as HTTP |
| **Route** | Wire deps → service → schema | Business logic, raw SQL |

Pattern: route → `Depends(get_db)` + auth deps → service function → return `*Public.model_validate(entity)`.

Register new routers in [`app/routes/__init__.py`](services/api/app/routes/__init__.py).

---

## Models

1. Prefer `EntityModel` (`id`, `created_at`, `updated_at`) or `OrganizationEntityModel` (+ `organization_id` FK) from `app.lib.persistence`.
2. Put tables under `app/models/{domain}/` and export in `DOMAIN_MODELS`.
3. Ensure `app/models/__init__.py` → `get_all_table_models()` includes the domain (already aggregates `user`, `organization`, `product`).
4. Schema changes need an **Alembic migration** (`alembic revision --autogenerate` / hand-written under `alembic/versions/`). Do not rely on test `create_all` alone for production schema.

Tenant-owned catalog data (products, future categories, etc.) → `OrganizationEntityModel` where `organization_id` is the **provider** org.

---

## Schemas

- Separate Create / Update / Public (see `app/schemas/product.py`).
- Update schemas: inherit from Create when fields match; make fields optional with `default=None`.
- Share validators on the base class (e.g. strip `name`).
- Public: `model_config = ConfigDict(from_attributes=True)`.
- Never accept `organization_id` in the body for tenant-scoped creates — take it from the resolved org dep.

---

## Auth and multi-tenant

### JWT

- Header: `Authorization: Bearer <token>`.
- Payload only has `sub` = user UUID (+ `exp`). **No org in the token.**
- `CurrentUserDep` → `get_current_user`.

### Organization context = query param

Always `?organization_id=<uuid>` (not header, not body).

| Alias | When | Org type |
|-------|------|----------|
| `ProviderOrgDep` | Provider tenant routes (required) | `provider` |
| `SellerOrgDep` | Seller tenant routes (required) | `seller` |
| `OptionalSellerOrgDep` | Seller catalog that can aggregate | `seller` if present |

Defined in `app/lib/security/deps.py`. Reuse them; do not redefine in route files.

### Membership check

`ensure_organization_access` (`access.py`):

1. Active row in `user_organization` for `(user_id, organization_id)` → else **403**
2. Load `organization` → else **404**
3. Optional `required_org_type` mismatch → **403**

### Provider vs seller data access

- **Provider:** scope by `entity.organization_id == organization.id`.
- **Seller read:** use `resolve_provider_ids(session, user_id, seller_organization_id)` from `app/services/provider_seller_link.py`, then filter entities whose `organization_id` is in that list (active `provider_seller_link`).
  - With `organization_id`: only that seller org’s linked providers.
  - Without: union of providers linked to **all** of the user’s seller orgs.
  - Filter `provider_id` not in allowed set → **403**; inaccessible entity → **404**.

---

## Services

- Async functions taking `AsyncSession` first (or early).
- Provider CRUD and seller read in **separate modules** when both exist (e.g. `product.py` vs `seller_product.py`).
- Cross-cutting link helpers stay in `provider_seller_link.py` (`list_active_provider_ids`, `resolve_provider_ids`, etc.).
- Partial updates: `apply_partial_update(entity, schema)` from `app.lib.persistence` (sets fields + `updated_at`).
- Commit/refresh after mutations (same style as `auth.py` / `product.py`).
- Raise `HTTPException` for not found / forbidden at the service boundary when the route would otherwise duplicate checks.

---

## Routes

- Thin: validate via schema, inject deps, call service, map to Public.
- Prefix + tags on the router (e.g. `/products/provider`, tags `["products"]`).
- Path params for resource ids; filters and `organization_id` as query.
- Status codes: create **201**, delete **204**, missing tenant-scoped resource **404** (not 403) when the id exists in another org.

Example provider list:

```http
GET /products/provider/?organization_id=<provider-uuid>&name=arroz
Authorization: Bearer <jwt>
```

Example seller aggregate catalog:

```http
GET /products/seller/
Authorization: Bearer <jwt>
```

---

## Tests

- DB: `POSTGRES_DB_TEST` / default `broker_test` (see `tests/conftest.py`).
- Run from `services/api`: `uv sync --extra dev` then `uv run pytest`.
- Prefer HTTP tests via `AsyncClient` + factories (`tests/factories/`).
- Cover: happy path, missing `organization_id` → 422, non-member → 403, wrong org type → 403, cross-tenant get → 404, seller without link → 404, unauthorized `provider_id` → 403.
- Auth helper: `bearer_headers(user_id=...)` — pass org via `params={"organization_id": ...}`, not headers.

---

## Checklist: new domain feature

1. [ ] Model (+ `DOMAIN_MODELS`) and Alembic migration if schema changes
2. [ ] Pydantic schemas (Create / Update / Public); inherit Update from Create when appropriate
3. [ ] Service module(s); split provider vs seller if both
4. [ ] Reuse `ProviderOrgDep` / `SellerOrgDep` / `OptionalSellerOrgDep` / `resolve_provider_ids` as needed
5. [ ] Routes + register in `routes/__init__.py`
6. [ ] Tests + factories
7. [ ] Verify paths in OpenAPI (`/docs` or `app.openapi()["paths"]`)
8. [ ] Later (frontends): `pnpm rpc:schema` + codegen in `@broker/api` — only when front needs the contract

---

## Anti-patterns

- Do **not** put `organization_id` in JWT or request body for tenant scope.
- Do **not** use `X-Organization-Id` (old `main` convention) unless migrating deliberately.
- Do **not** redefine `*OrgDep` aliases inside route modules.
- Do **not** mix provider CRUD and seller access logic in one service file.
- Do **not** invent Dishka / `AppModule` / repository classes for new work on this scaffold.
- Do **not** return 403 for “product exists but other org” on provider get — use **404**.
- Do **not** skip membership checks and trust client-supplied org ids alone.

---

## Key imports

```python
from app.lib.security.deps import (
    CurrentUserDep,
    ProviderOrgDep,
    SellerOrgDep,
    OptionalSellerOrgDep,
)
from app.lib.persistence import apply_partial_update, OrganizationEntityModel
from app.services import provider_seller_link as link_service
# link_service.resolve_provider_ids(session, user_id, seller_organization_id)
```
