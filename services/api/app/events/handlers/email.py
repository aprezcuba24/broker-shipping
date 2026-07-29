from __future__ import annotations

from app.db.context import AppContext
from app.events.types import (
    EmailVerificationRequestedEvent,
    MemberInvitedEvent,
    SellerLinkRequestedEvent,
)
from app.lib.events.registry import listener
from app.services import organization as org_service
from app.services.email import (
    send_member_invitation_email,
    send_seller_link_request_email,
    send_verification_email,
)


@listener(MemberInvitedEvent)
async def on_member_invited(event: MemberInvitedEvent) -> None:
    await send_member_invitation_email(
        to=event.invitee_email,
        organization_name=event.organization_name,
        accept_url=event.accept_url,
    )


@listener(SellerLinkRequestedEvent)
async def on_seller_link_requested(
    event: SellerLinkRequestedEvent,
    ctx: AppContext,
) -> None:
    members = await org_service.list_active_member_users(
        ctx.session, event.invitation.organization_id
    )
    recipient_emails = [member.email for member in members]
    for to in recipient_emails:
        await send_seller_link_request_email(
            to=to,
            provider_organization_name=event.provider_organization_name,
            seller_organization_name=event.seller_organization_name,
            review_url=event.review_url,
        )


@listener(EmailVerificationRequestedEvent)
async def on_email_verification_requested(
    event: EmailVerificationRequestedEvent,
) -> None:
    await send_verification_email(
        to=event.email,
        name=event.name,
        verify_url=event.verify_url,
    )
