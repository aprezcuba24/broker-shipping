from uuid import UUID

from dishka import FromDishka
from dishka.integrations.fastapi import DishkaRoute
from fastapi import APIRouter, Depends, HTTPException, Response

from app.lib.security.deps import require_organization
from app.modules.organization.models import ApiKey, ApiKeyPublic, OrganizationType
from app.modules.organization.services import ApiKeyService

router = APIRouter(route_class=DishkaRoute)


class ApiKeyCreatedResponse(ApiKeyPublic):
    raw_key: str


@router.post(
    "/{organization_id}/api-keys",
    response_model=ApiKeyCreatedResponse,
    status_code=201,
    dependencies=[Depends(require_organization(OrganizationType.provider))],
)
async def create_api_key(
    organization_id: UUID,
    body: ApiKey,
    api_keys: FromDishka[ApiKeyService],
):
    entity = ApiKey(**body.model_dump(exclude=ApiKeyService.creation_exclude()))
    raw, entity = await api_keys.create_for_organization(organization_id, entity.name)
    pub = api_keys.to_api_key_public(entity)
    return ApiKeyCreatedResponse(**pub.model_dump(), raw_key=raw)


@router.get(
    "/{organization_id}/api-keys",
    response_model=list[ApiKeyPublic],
    dependencies=[Depends(require_organization(OrganizationType.provider))],
)
async def list_api_keys(
    organization_id: UUID,
    api_keys: FromDishka[ApiKeyService],
):
    rows = await api_keys.list_for_organization(organization_id)
    return [api_keys.to_api_key_public(r) for r in rows]


@router.delete(
    "/{organization_id}/api-keys/{key_id}",
    status_code=204,
    dependencies=[Depends(require_organization(OrganizationType.provider))],
)
async def revoke_api_key(
    organization_id: UUID,
    key_id: UUID,
    api_keys: FromDishka[ApiKeyService],
):
    existing = await api_keys.get(key_id)
    if existing is None or existing.organization_id != organization_id:
        raise HTTPException(status_code=404, detail="API key not found")
    await api_keys.revoke_key(key_id)
    return Response(status_code=204)
