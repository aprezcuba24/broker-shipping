from uuid import UUID

from sqlalchemy import Column, ForeignKey
from sqlmodel import Field, SQLModel


class SellerOrganizationData(SQLModel, table=True):
    __tablename__ = "seller_organization_data"

    seller_organization_id: UUID = Field(
        sa_column=Column(
            ForeignKey("organization.id", ondelete="CASCADE"),
            primary_key=True,
            nullable=False,
        ),
    )
    last_invoice_number: int = Field(default=0, nullable=False)
