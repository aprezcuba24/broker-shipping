from pydantic import ConfigDict, Field
from sqlmodel import SQLModel

from app.types import PlatformProductCode


class PlatformProductPublic(SQLModel):
    model_config = ConfigDict(from_attributes=True)

    code: PlatformProductCode
    name: str
    description: str | None = None


class OrganizationPlatformProductPublic(SQLModel):
    code: PlatformProductCode
    name: str
    description: str | None = None
    enabled: bool


class OrganizationPlatformProductsReplace(SQLModel):
    codes: list[PlatformProductCode] = Field(min_length=0)
