from datetime import datetime
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel

from app.lib.utils import utc_now


class User(SQLModel, table=True):
    __tablename__ = "user"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(max_length=255)
    email: str = Field(max_length=255, unique=True, index=True)
    password_hash: str = Field(max_length=255)
    is_super_admin: bool = Field(default=False, index=True)
    email_verified_at: datetime | None = Field(default=None)
    email_verification_token_hash: str | None = Field(default=None, max_length=64)
    email_verification_expires_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=utc_now)

    @property
    def email_verified(self) -> bool:
        return self.email_verified_at is not None
