"""Swagger / OpenAPI: tags, custom schema hook, JWT **or** API key under hybrid prefixes."""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

from app.config import settings

OPENAPI_TAGS: list[dict[str, str]] = [
    {
        "name": "users",
        "description": "Sign-up, JWT login (`/users/login`) and current user profile (`/users/me`).",
    },
    {
        "name": "products",
        "description": (
            "Product catalog CRUD protected with JWT Bearer **or** organization `X-API-Key`. "
            "JWT requests must also send `X-Organization-Id` for a membership the user belongs to."
        ),
    },
    {
        "name": "organizations",
        "description": "Organizations and per-organization API keys (JWT Bearer required).",
    },
]

SWAGGER_UI_PARAMETERS = {"persistAuthorization": True}

# Routes under these path prefixes use user JWT **or** organization API key (OR in OpenAPI).
OPENAPI_OR_SECURITY_PREFIXES: tuple[str, ...] = ("/products",)

OPENAPI_OR_SECURITY: list[dict[str, list[str]]] = [
    {"BrokerBearer": []},
    {"BrokerApiKey": []},
]

_HTTP_OPS = frozenset(
    {"get", "post", "put", "delete", "patch", "options", "head", "trace"},
)


def _patch_or_security_for_hybrid_routes(schema: dict[str, Any]) -> None:
    paths = schema.get("paths")
    if not isinstance(paths, dict):
        return
    for path_str, path_item in paths.items():
        if not isinstance(path_str, str) or not isinstance(path_item, dict):
            continue
        if not any(
            path_str == p or path_str.startswith(f"{p}/") for p in OPENAPI_OR_SECURITY_PREFIXES
        ):
            continue
        for verb, operation in path_item.items():
            if verb not in _HTTP_OPS or not isinstance(operation, dict):
                continue
            operation["security"] = list(OPENAPI_OR_SECURITY)


def custom_openapi_schema(app: FastAPI) -> dict[str, Any]:
    if app.openapi_schema is not None:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        openapi_version=getattr(app, "openapi_version", "3.1.0"),
        description=app.description,
        routes=app.routes,
        tags=app.openapi_tags,
    )
    url = settings.openapi_server_url
    if url:
        openapi_schema["servers"] = [{"url": url.rstrip("/")}]
    _patch_or_security_for_hybrid_routes(openapi_schema)
    app.openapi_schema = openapi_schema
    return openapi_schema


def attach_openapi(app: FastAPI) -> None:
    """Wire cached OpenAPI document into ``app.openapi`` for ``/openapi.json``, `/docs`, ReDoc."""

    def openapi_document() -> dict[str, Any]:
        return custom_openapi_schema(app)

    app.openapi = openapi_document
