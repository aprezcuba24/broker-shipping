from uuid import UUID

from sqlmodel import Field, SQLModel

from app.lib.persistence import FilterFieldConfig, FilterOperator, FilterSpec, OrganizationEntityModel


class ProductCreate(SQLModel):
    name: str = Field(max_length=255)
    category_id: UUID
    price: int = Field(ge=0, description="Price in cents")


class Product(OrganizationEntityModel, table=True):
    name: str = Field(max_length=255)
    category_id: UUID = Field(foreign_key="category.id", index=True)
    price: int = Field(ge=0, description="Price in cents")


PRODUCT_LIST_FILTER_SPEC = FilterSpec(
    model=Product,
    fields={
        "category_id": FilterFieldConfig(operator=FilterOperator.eq),
        "name": FilterFieldConfig(operator=FilterOperator.ilike),
    },
)

ProductListFilters = PRODUCT_LIST_FILTER_SPEC.as_params_model()
product_list_filters = PRODUCT_LIST_FILTER_SPEC.as_dependency()
