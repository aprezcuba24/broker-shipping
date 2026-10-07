from sqlalchemy import Column, Text
from sqlmodel import Field

from app.lib.persistence.organization_entity_model import OrganizationEntityModel


class AdsMessage(OrganizationEntityModel, table=True):
    __tablename__ = "ads_message"

    title: str = Field(max_length=255, index=True)
    description: str = Field(sa_column=Column(Text, nullable=False))
    photo_key: str | None = Field(default=None, max_length=512)
    code: str = Field(max_length=4, unique=True, index=True)
