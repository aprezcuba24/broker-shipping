from fastapi import APIRouter

from app.deps import SessionDep
from app.lib.security.deps import ProviderManagementOrgDep
from app.schemas.messaging import MessagingSettingsPublic, MessagingSettingsUpdate
from app.services.messaging import settings as messaging_settings_service

router = APIRouter(prefix="/messaging-settings/provider", tags=["messaging"])


@router.get("/", response_model=MessagingSettingsPublic)
async def get_messaging_settings(
    organization: ProviderManagementOrgDep,
    session: SessionDep,
) -> MessagingSettingsPublic:
    return await messaging_settings_service.get_messaging_settings(
        session,
        organization.id,
    )


@router.patch("/", response_model=MessagingSettingsPublic)
async def patch_messaging_settings(
    body: MessagingSettingsUpdate,
    organization: ProviderManagementOrgDep,
    session: SessionDep,
) -> MessagingSettingsPublic:
    return await messaging_settings_service.update_messaging_settings(
        session,
        organization.id,
        body,
    )
