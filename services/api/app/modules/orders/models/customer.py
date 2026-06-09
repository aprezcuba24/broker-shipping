from uuid import UUID

from sqlalchemy import Column, ForeignKey, UniqueConstraint
from sqlmodel import Field

from app.lib.persistence import FilterFieldConfig, FilterOperator, FilterSpec, OrganizationEntityModel


class Customer(OrganizationEntityModel, table=True):
    __tablename__ = "customer"
    __table_args__ = (
        UniqueConstraint("organization_id", "phone", name="uq_customer_org_phone"),
        UniqueConstraint("organization_id", "identification", name="uq_customer_org_identification"),
    )

    organization_id: UUID = Field(
        sa_column=Column(
            ForeignKey("organization.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
    )
    name: str = Field(max_length=255)
    phone: str = Field(max_length=32)
    identification: str = Field(max_length=64)


CUSTOMER_LIST_FILTER_SPEC = FilterSpec(
    model=Customer,
    fields={
        "q": FilterFieldConfig(
            operator=FilterOperator.or_ilike,
            columns=["name", "phone", "identification"],
        ),
    },
)

CustomerListFilters = CUSTOMER_LIST_FILTER_SPEC.as_params_model()
customer_list_filters = CUSTOMER_LIST_FILTER_SPEC.as_dependency()
