from typing import Any, ClassVar
from uuid import UUID

from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field

from app.lib.persistence import (
    EntityModel,
    FilterFieldConfig,
    FilterOperator,
    FilterSpec,
)


class Order(EntityModel, table=True):
    __tablename__ = "order"

    IMMUTABLE_FIELDS: ClassVar[frozenset[str]] = (
        EntityModel.IMMUTABLE_FIELDS
        | frozenset(
            {
                "name",
                "seller_organization_id",
                "customer_id",
                "customer_snapshot",
                "address_snapshot",
            },
        )
    )

    name: str = Field(max_length=255)
    seller_organization_id: UUID = Field(
        sa_column=Column(
            ForeignKey("organization.id", ondelete="RESTRICT"),
            nullable=False,
            index=True,
        ),
    )
    customer_id: UUID = Field(
        sa_column=Column(
            ForeignKey("customer.id", ondelete="RESTRICT"),
            nullable=False,
            index=True,
        ),
    )
    customer_snapshot: dict[str, Any] = Field(
        sa_column=Column(JSONB, nullable=False),
        description="Customer data at order time: customer_id, name, phone, identification.",
    )
    address_snapshot: dict[str, Any] = Field(
        sa_column=Column(JSONB, nullable=False),
        description=(
            "Address data at order time: address_id, province, municipality, "
            "district, neighborhood, address, reference."
        ),
    )


_SHARED_ORDER_LIST_FIELDS = {
    "name": FilterFieldConfig(operator=FilterOperator.ilike),
    "created_at_from": FilterFieldConfig(
        operator=FilterOperator.gte,
        column="created_at",
    ),
    "created_at_to": FilterFieldConfig(
        operator=FilterOperator.lte,
        column="created_at",
    ),
    "customer_name": FilterFieldConfig(
        operator=FilterOperator.json_ilike,
        column="customer_snapshot",
        json_key="name",
    ),
    "customer_phone": FilterFieldConfig(
        operator=FilterOperator.json_ilike,
        column="customer_snapshot",
        json_key="phone",
    ),
    "customer_identification": FilterFieldConfig(
        operator=FilterOperator.json_ilike,
        column="customer_snapshot",
        json_key="identification",
    ),
}

SELLER_ORDER_LIST_FILTER_SPEC = FilterSpec(
    model=Order,
    fields={
        **_SHARED_ORDER_LIST_FIELDS,
        "provider_organization_id": FilterFieldConfig(
            operator=FilterOperator.eq,
            virtual=True,
            annotation=UUID,
        ),
    },
)

PROVIDER_ORDER_LIST_FILTER_SPEC = FilterSpec(
    model=Order,
    fields={
        **_SHARED_ORDER_LIST_FIELDS,
        "seller_organization_id": FilterFieldConfig(operator=FilterOperator.eq),
    },
)

SellerOrderListFilters = SELLER_ORDER_LIST_FILTER_SPEC.as_params_model(
    model_name="SellerOrderListFilters",
)
ProviderOrderListFilters = PROVIDER_ORDER_LIST_FILTER_SPEC.as_params_model(
    model_name="ProviderOrderListFilters",
)
seller_order_list_filters = SELLER_ORDER_LIST_FILTER_SPEC.as_dependency()
provider_order_list_filters = PROVIDER_ORDER_LIST_FILTER_SPEC.as_dependency()
