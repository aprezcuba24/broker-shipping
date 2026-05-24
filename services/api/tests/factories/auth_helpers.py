from __future__ import annotations

from uuid import UUID

from app.lib.security.tokens import encode_access_token


def bearer_headers(*, user_id: UUID | str) -> dict[str, str]:
    uid = user_id if isinstance(user_id, UUID) else UUID(str(user_id))
    return {"Authorization": f"Bearer {encode_access_token(uid)}"}


def organization_headers(*, organization_id: UUID | str) -> dict[str, str]:
    oid = organization_id if isinstance(organization_id, UUID) else UUID(str(organization_id))
    return {"X-Organization-Id": str(oid)}


def tenant_headers(*, user_id: UUID | str, organization_id: UUID | str) -> dict[str, str]:
    return {
        **bearer_headers(user_id=user_id),
        **organization_headers(organization_id=organization_id),
    }


def api_key_headers(*, raw_key: str) -> dict[str, str]:
    return {"X-API-Key": raw_key}
