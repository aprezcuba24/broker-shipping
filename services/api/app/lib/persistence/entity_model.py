from datetime import datetime
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel

from app.lib.utils import utc_now


class EntityModel(SQLModel):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime | None = Field(default=None)
