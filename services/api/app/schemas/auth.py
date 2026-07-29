from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.fields import NonEmptyStr, NormalizedEmail
from app.types import ClientApp


class UserRegister(BaseModel):
    name: NonEmptyStr = Field(max_length=255)
    email: NormalizedEmail
    password: str = Field(min_length=8, max_length=128)
    client_app: ClientApp


class UserLogin(BaseModel):
    email: NormalizedEmail
    password: str


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: EmailStr
    is_super_admin: bool
    email_verified: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class VerifyEmailRequest(BaseModel):
    token: NonEmptyStr = Field(max_length=512)


class ResendVerificationRequest(BaseModel):
    email: NormalizedEmail
    client_app: ClientApp


class MessageResponse(BaseModel):
    message: str
