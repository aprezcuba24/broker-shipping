from uuid import UUID

from sqlalchemy import Column, ForeignKey
from sqlmodel import Field

from app.lib.persistence import FilterFieldConfig, FilterOperator, FilterSpec, OrganizationEntityModel


class Product(OrganizationEntityModel, table=True):
    name: str = Field(max_length=255)
    category_id: UUID = Field(
        sa_column=Column(
            ForeignKey("category.id", ondelete="RESTRICT"),
            nullable=False,
            index=True,
        ),
    )


PRODUCT_LIST_FILTER_SPEC = FilterSpec(
    model=Product,
    fields={
        "category_id": FilterFieldConfig(operator=FilterOperator.eq),
        "name": FilterFieldConfig(operator=FilterOperator.ilike),
    },
)

ProductListFilters = PRODUCT_LIST_FILTER_SPEC.as_params_model()
product_list_filters = PRODUCT_LIST_FILTER_SPEC.as_dependency()
