from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True)
class MemberInvitedEvent:
    invitation_id: UUID
    invitee_email: str
    organization_name: str
    accept_url: str


@dataclass(frozen=True)
class SellerLinkRequestedEvent:
    invitation_id: UUID
    provider_organization_name: str
    seller_organization_name: str
    review_url: str
    recipient_emails: tuple[str, ...]


@dataclass(frozen=True)
class EmailVerificationRequestedEvent:
    user_id: UUID
    email: str
    name: str
    verify_url: str
