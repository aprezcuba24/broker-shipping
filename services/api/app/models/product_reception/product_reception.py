from datetime import datetime

from sqlmodel import Field

from app.lib.persistence.organization_entity_model import OrganizationEntityModel
from app.lib.utils import utc_now


class ProductReception(OrganizationEntityModel, table=True):
    __tablename__ = "product_reception"

    received_at: datetime = Field(default_factory=utc_now, index=True)
