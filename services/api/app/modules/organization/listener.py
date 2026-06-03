import logging

from dishka import FromDishka
from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.event_dispatcher import EventDispatcher
from app.lib.headers import get_header_value
from app.modules.organization.models import OrganizationType
from app.modules.organization.repositories import UserOrganizationRepository
from app.modules.products.events import ProductCreated
from app.modules.user.events import UserLoginAttempt

logger = logging.getLogger(__name__)

_ORGANIZATION_TYPE = {
    "provider_app": OrganizationType.provider,
    "seller_app": OrganizationType.seller,
}


async def _on_product_created(
    event: ProductCreated,
    session: FromDishka[AsyncSession],  # noqa: ARG001 — available for DB work
) -> None:
    logger.info("organization noticed new product: id=%s", event.entity.id)


async def _on_user_login_attempt(
    event: UserLoginAttempt,
    user_org_repo: FromDishka[UserOrganizationRepository],
) -> bool:
    app_type = get_header_value(event.request.headers, "app_type", "x-app-type")
    if app_type is None or app_type not in _ORGANIZATION_TYPE:
        return False
    if event.entity.is_super_admin:
        return True
    orgs = await user_org_repo.list_organizations_for_user(
        event.entity.id,
        org_type=_ORGANIZATION_TYPE[app_type],
    )
    return bool(orgs)


def register_listeners(dispatcher: EventDispatcher) -> None:
    dispatcher.subscribe(ProductCreated, _on_product_created)
    dispatcher.subscribe_gate(UserLoginAttempt, _on_user_login_attempt)
