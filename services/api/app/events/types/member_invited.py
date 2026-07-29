from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from app.config import settings
from app.models.organization.enums import OrganizationType
from app.models.organization.organization import Organization
from app.models.organization.organization_invitation import OrganizationInvitation
from app.types import ClientApp


@dataclass(frozen=True)
class MemberInvitedEvent:
    invitation: OrganizationInvitation
    organization: Organization

    @property
    def invitation_id(self) -> UUID:
        return self.invitation.id

    @property
    def invitee_email(self) -> str:
        assert self.invitation.invitee_email is not None
        return self.invitation.invitee_email

    @property
    def organization_name(self) -> str:
        return self.organization.name

    @property
    def client_app(self) -> ClientApp:
        if self.organization.type == OrganizationType.provider:
            return "backoffice"
        return "seller"

    @property
    def accept_url(self) -> str:
        return (
            f"{settings.frontend_base_url(self.client_app)}"
            f"/accept-invitation?token={self.invitation.token}"
        )
