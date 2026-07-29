from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from app.config import settings
from app.models.organization.organization import Organization
from app.models.organization.organization_invitation import OrganizationInvitation
from app.models.user.user import User


@dataclass(frozen=True)
class SellerLinkRequestedEvent:
    invitation: OrganizationInvitation
    provider: Organization
    seller: Organization
    members: tuple[User, ...]

    @property
    def invitation_id(self) -> UUID:
        return self.invitation.id

    @property
    def provider_organization_name(self) -> str:
        return self.provider.name

    @property
    def seller_organization_name(self) -> str:
        return self.seller.name

    @property
    def review_url(self) -> str:
        return (
            f"{settings.frontend_base_url('backoffice')}/settings/invitations"
        )

    @property
    def recipient_emails(self) -> tuple[str, ...]:
        return tuple(m.email for m in self.members)
