from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.customer.enums import PhoneBlacklistReason
from app.schemas.fields import NormalizedPhone, OptionalStrippedStr
from app.types import PhoneBlacklistStatus


class PhoneBlacklistCreate(BaseModel):
    phone: NormalizedPhone = Field(max_length=50)
    reason: PhoneBlacklistReason
    note: OptionalStrippedStr = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def note_required_for_other(self) -> "PhoneBlacklistCreate":
        if self.reason == PhoneBlacklistReason.other and not self.note:
            raise ValueError("note is required when reason is other")
        return self


class PhoneBlacklistPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    phone: str
    organization_id: UUID
    created_by_user_id: UUID
    reason: PhoneBlacklistReason
    note: str | None
    withdrawn_at: datetime | None
    created_at: datetime
    updated_at: datetime | None


class PhoneBlacklistStatusPublic(BaseModel):
    phone: str
    status: PhoneBlacklistStatus
    own_entry_id: UUID | None = None
    other_count: int = 0


class PhoneBlacklistCustomerSummary(BaseModel):
    id: UUID
    name: str
    ci: str | None = None


class PhoneBlacklistListItem(BaseModel):
    id: UUID
    phone: str
    organization_id: UUID
    reason: PhoneBlacklistReason
    note: str | None
    created_at: datetime
    other_count: int = 0
    customer: PhoneBlacklistCustomerSummary | None = None
