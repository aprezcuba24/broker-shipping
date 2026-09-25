from fastapi import APIRouter, Query, Response

from app.deps import SessionDep
from app.lib.security.deps import AnyOrgDep, CurrentUserDep
from app.schemas.phone_blacklist import (
    PhoneBlacklistCreate,
    PhoneBlacklistPublic,
    PhoneBlacklistStatusPublic,
)
from app.services import phone_blacklist as phone_blacklist_service

router = APIRouter(prefix="/phone-blacklist", tags=["phone-blacklist"])


@router.get("/status", response_model=PhoneBlacklistStatusPublic)
async def get_phone_blacklist_status(
    organization: AnyOrgDep,
    session: SessionDep,
    phone: str = Query(min_length=1),
) -> PhoneBlacklistStatusPublic:
    return await phone_blacklist_service.get_status_for_phone(
        session,
        organization_id=organization.id,
        phone=phone,
    )


@router.post("/", response_model=PhoneBlacklistPublic, status_code=201)
async def create_phone_blacklist_entry(
    body: PhoneBlacklistCreate,
    organization: AnyOrgDep,
    user: CurrentUserDep,
    session: SessionDep,
) -> PhoneBlacklistPublic:
    entry = await phone_blacklist_service.add_to_blacklist(
        session,
        organization_id=organization.id,
        user_id=user.id,
        data=body,
    )
    return PhoneBlacklistPublic.model_validate(entry)


@router.delete("/", status_code=204)
async def withdraw_phone_blacklist_entry(
    organization: AnyOrgDep,
    session: SessionDep,
    phone: str = Query(min_length=1),
) -> Response:
    await phone_blacklist_service.withdraw_own_entry(
        session,
        organization_id=organization.id,
        phone=phone,
    )
    return Response(status_code=204)
