"""OpenAPI JSON: security schemes and hybrid-route OR semantics."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from httpx import AsyncClient

from app.lib.openapi import OPENAPI_OR_SECURITY

_EXPORTED_OPENAPI = (
    Path(__file__).resolve().parents[3] / "packages" / "api" / "openapi.json"
)


@pytest.mark.asyncio(loop_scope="session")
async def test_openapi_components_and_hybrid_products_security(client: AsyncClient):
    r = await client.get("/openapi.json")
    assert r.status_code == 200
    schema = r.json()

    schemes = schema.get("components", {}).get("securitySchemes", {})
    assert "BrokerBearer" in schemes
    assert schemes["BrokerBearer"].get("type") == "http"
    assert schemes["BrokerBearer"].get("scheme") == "bearer"
    assert "BrokerApiKey" in schemes
    assert schemes["BrokerApiKey"].get("type") == "apiKey"
    assert schemes["BrokerApiKey"].get("name") == "X-API-Key"
    assert schemes["BrokerApiKey"].get("in") == "header"
    assert "BrokerOrganization" in schemes
    assert schemes["BrokerOrganization"].get("type") == "apiKey"
    assert schemes["BrokerOrganization"].get("name") == "X-Organization-Id"
    assert schemes["BrokerOrganization"].get("in") == "header"

    prod_get = schema["paths"]["/products/provider/"]["get"]
    assert prod_get["security"] == OPENAPI_OR_SECURITY

    health_get = schema["paths"]["/health"]["get"]
    assert health_get.get("security") in (None, [], [{}])


def test_exported_openapi_includes_domain_paths():
    """Committed packages/api/openapi.json must expose core RPC surfaces."""
    assert _EXPORTED_OPENAPI.is_file(), (
        "Run `pnpm rpc:schema` from the monorepo root to generate openapi.json"
    )
    schema = json.loads(_EXPORTED_OPENAPI.read_text(encoding="utf-8"))
    paths = schema.get("paths", {})
    assert "/users/login" in paths
    assert "/organizations/" in paths
    assert "/products/provider/" in paths
    assert "/products/seller/" in paths
    assert "/products/categories/" in paths
