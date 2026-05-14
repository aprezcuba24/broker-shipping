from __future__ import annotations

from datetime import datetime
from typing import ClassVar
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict, Field as PydanticField
from sqlmodel import Field, SQLModel

from app.lib.utils import utc_now


class UserBase(SQLModel):
    username: str = Field(max_length=255, unique=True, index=True)


class User(UserBase, table=True):
    IMMUTABLE_FIELDS: ClassVar[frozenset[str]] = frozenset(
        {"id", "password_hash", "created_at"}
    )
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    password_hash: str = Field(max_length=255)
    created_at: datetime = Field(default_factory=utc_now)


class UserCredentials(BaseModel):
    username: str
    password: str


class UserSignup(UserCredentials):
    username: str = PydanticField(min_length=1, max_length=255)
    password: str = PydanticField(min_length=1, max_length=128)


class UserLogin(UserCredentials):
    pass


class UserPublic(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
