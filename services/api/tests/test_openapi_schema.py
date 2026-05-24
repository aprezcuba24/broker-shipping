"""OpenAPI JSON: security schemes and hybrid-route OR semantics."""

from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.lib.openapi import OPENAPI_OR_SECURITY


pytestmark = pytest.mark.asyncio(loop_scope="session")


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

    prod_get = schema["paths"]["/products/"]["get"]
    assert prod_get["security"] == OPENAPI_OR_SECURITY

    health_get = schema["paths"]["/health"]["get"]
    assert health_get.get("security") in (None, [], [{}])
