"""OpenAPI security schemes (shared instances for stable ``components.securitySchemes``)."""

from fastapi.security import APIKeyHeader, HTTPBearer

broker_bearer = HTTPBearer(auto_error=False, scheme_name="BrokerBearer")
broker_api_key = APIKeyHeader(
    name="X-API-Key",
    auto_error=False,
    scheme_name="BrokerApiKey",
)
broker_organization = APIKeyHeader(
    name="X-Organization-Id",
    auto_error=False,
    scheme_name="BrokerOrganization",
)
