from uuid import UUID

from fastapi import APIRouter, Response

from app.deps import SessionDep
from app.lib.security.deps import JwtUserDep
from app.schemas.api_key import ApiKeyCreate, ApiKeyCreatedResponse, ApiKeyPublic
from app.services import api_key as api_key_service

router = APIRouter(prefix="/users/me/api-keys", tags=["api-keys"])


@router.post("/", response_model=ApiKeyCreatedResponse, status_code=201)
async def create_api_key(
    body: ApiKeyCreate,
    user: JwtUserDep,
    session: SessionDep,
) -> ApiKeyCreatedResponse:
    raw, entity = await api_key_service.create_for_user(session, user, body)
    pub = ApiKeyPublic.model_validate(entity)
    return ApiKeyCreatedResponse(**pub.model_dump(), raw_key=raw)


@router.get("/", response_model=list[ApiKeyPublic])
async def list_api_keys(
    user: JwtUserDep,
    session: SessionDep,
) -> list[ApiKeyPublic]:
    rows = await api_key_service.list_for_user(session, user.id)
    return [ApiKeyPublic.model_validate(row) for row in rows]


@router.delete("/{key_id}", status_code=204)
async def revoke_api_key(
    key_id: UUID,
    user: JwtUserDep,
    session: SessionDep,
) -> Response:
    await api_key_service.revoke_for_user(session, user.id, key_id)
    return Response(status_code=204)
