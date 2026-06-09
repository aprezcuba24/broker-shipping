from __future__ import annotations

from datetime import datetime
from typing import Any, Self
from uuid import UUID

from pydantic import model_validator
from sqlmodel import Field, SQLModel

from app.modules.orders.models.address import Address
from app.modules.orders.models.customer import Customer
from app.modules.orders.models.enums import OrderLineStatus, OrderStatus
from app.modules.orders.models.order import Order
from app.modules.orders.models.order_line import OrderLine
from app.modules.orders.order_status import compute_order_status
from app.modules.orders.order_totals import compute_order_price, compute_order_product_price
from app.modules.organization.models import Organization


class OrderLineCreate(SQLModel):
    product_id: UUID
    quantity: int = Field(gt=0)
    price: int = Field(ge=0, description="Unit price in cents")


class CustomerInput(SQLModel):
    name: str = Field(max_length=255)
    phone: str = Field(min_length=1, max_length=32)
    identification: str = Field(min_length=1, max_length=64)


class AddressInput(SQLModel):
    province: str = Field(max_length=255)
    municipality: str = Field(max_length=255)
    district: str = Field(max_length=255)
    neighborhood: str = Field(max_length=255)
    address: str = Field(max_length=255)
    reference: str | None = Field(default=None, max_length=255)


class OrderCreate(SQLModel):
    name: str = Field(max_length=255)
    lines: list[OrderLineCreate] = Field(min_length=1)
    customer_id: UUID | None = None
    customer: CustomerInput | None = None
    address_id: UUID | None = None
    address: AddressInput | None = None

    @model_validator(mode="after")
    def validate_customer_and_address_xor(self) -> Self:
        has_customer_id = self.customer_id is not None
        has_customer = self.customer is not None
        if has_customer_id == has_customer:
            raise ValueError("Exactly one of customer_id or customer must be provided")

        has_address_id = self.address_id is not None
        has_address = self.address is not None
        if has_address_id == has_address:
            raise ValueError("Exactly one of address_id or address must be provided")

        return self


class CustomerSummary(SQLModel):
    id: UUID
    name: str
    phone: str
    identification: str


class AddressDetail(SQLModel):
    id: UUID
    province: str
    municipality: str
    district: str
    neighborhood: str
    address: str
    reference: str | None
    is_active: bool


class CustomerDetail(CustomerSummary):
    addresses: list[AddressDetail]

    @classmethod
    def from_entities(cls, customer: Customer, addresses: list[Address]) -> CustomerDetail:
        return cls(
            id=customer.id,
            name=customer.name,
            phone=customer.phone,
            identification=customer.identification,
            addresses=[AddressDetail.model_validate(a) for a in addresses],
        )


class OrganizationRef(SQLModel):
    id: UUID
    name: str


class OrderLineDetail(SQLModel):
    id: UUID
    created_at: datetime
    updated_at: datetime | None
    order_id: UUID
    product_id: UUID | None
    organization_id: UUID
    organization: OrganizationRef
    quantity: int
    product_price: int
    price: int
    status: OrderLineStatus
    product_snapshot: dict[str, Any]


class OrderDetail(SQLModel):
    id: UUID
    name: str
    seller_organization_id: UUID
    customer_id: UUID
    customer_snapshot: dict[str, Any]
    address_snapshot: dict[str, Any]
    created_at: datetime
    updated_at: datetime | None
    status: OrderStatus
    product_price: int
    price: int
    lines: list[OrderLineDetail]


def build_customer_snapshot(customer: Customer) -> dict[str, Any]:
    return {
        "customer_id": str(customer.id),
        "name": customer.name,
        "phone": customer.phone,
        "identification": customer.identification,
    }


def build_address_snapshot(address: Address) -> dict[str, Any]:
    return {
        "address_id": str(address.id),
        "province": address.province,
        "municipality": address.municipality,
        "district": address.district,
        "neighborhood": address.neighborhood,
        "address": address.address,
        "reference": address.reference,
    }


def build_order_line_detail(
    line: OrderLine,
    org: Organization | None,
) -> OrderLineDetail:
    return OrderLineDetail(
        id=line.id,
        created_at=line.created_at,
        updated_at=line.updated_at,
        order_id=line.order_id,
        product_id=line.product_id,
        organization_id=line.organization_id,
        organization=OrganizationRef(
            id=line.organization_id,
            name=org.name if org is not None else "",
        ),
        quantity=line.quantity,
        product_price=line.product_price,
        price=line.price,
        status=line.status,
        product_snapshot=line.product_snapshot,
    )


def build_order_detail(
    order: Order,
    lines: list[OrderLine],
    orgs_by_id: dict[UUID, Organization],
) -> OrderDetail:
    return OrderDetail(
        id=order.id,
        name=order.name,
        seller_organization_id=order.seller_organization_id,
        customer_id=order.customer_id,
        customer_snapshot=order.customer_snapshot,
        address_snapshot=order.address_snapshot,
        created_at=order.created_at,
        updated_at=order.updated_at,
        status=compute_order_status(lines),
        product_price=compute_order_product_price(lines),
        price=compute_order_price(lines),
        lines=[
            build_order_line_detail(line, orgs_by_id.get(line.organization_id))
            for line in lines
        ],
    )
