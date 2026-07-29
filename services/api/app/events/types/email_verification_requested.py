from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from app.config import settings
from app.models.user.user import User
from app.types import ClientApp


@dataclass(frozen=True)
class EmailVerificationRequestedEvent:
    user: User
    client_app: ClientApp
    raw_token: str

    @property
    def user_id(self) -> UUID:
        return self.user.id

    @property
    def email(self) -> str:
        return self.user.email

    @property
    def name(self) -> str:
        return self.user.name

    @property
    def verify_url(self) -> str:
        return (
            f"{settings.frontend_base_url(self.client_app)}"
            f"/verify-email?token={self.raw_token}"
        )
