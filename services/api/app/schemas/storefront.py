from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.lib.storage.deps import get_object_storage
from app.models.order.order import Order
from app.models.product.product import Product
from app.lib.storage.deps import get_object_storage
from app.models.order.order import Order
from app.models.product.product import Product
from app.schemas.customer import AddressCreate
from app.schemas.fields import NonEmptyStr, NormalizedPhone
from app.schemas.money import Money
from app.services.order.helpers import compute_order_totals
from app.services.order.helpers import compute_order_totals


class StorefrontInfoPublic(BaseModel):
    organization_id: UUID
    name: str


class StorefrontTagPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str


class StorefrontProductPublic(BaseModel):
    id: UUID
    name: str
    description: str | None = None
    price: Money
    stock: int
    image_url: str | None = None
    tags: list[StorefrontTagPublic] = Field(default_factory=list)


class StorefrontCheckoutItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(gt=0)


class StorefrontCheckoutCreate(BaseModel):
    name: NonEmptyStr = Field(max_length=255)
    ci: NonEmptyStr = Field(max_length=50)
    phone: NormalizedPhone = Field(max_length=50)
    address: AddressCreate
    items: list[StorefrontCheckoutItemCreate] = Field(min_length=1)


class StorefrontCheckoutItemPublic(BaseModel):
    product_id: UUID
    product_name: str
    quantity: int
    unit_price: Money
    line_total: Money


class StorefrontCheckoutPublic(BaseModel):
    order_id: UUID
    code: str
    items: list[StorefrontCheckoutItemPublic]
    totals: list[Money] = Field(default_factory=list)


def storefront_product_to_public(product: Product) -> StorefrontProductPublic:
    sale_price_amount = getattr(product, "sale_price", None)
    amount = sale_price_amount if sale_price_amount is not None else product.price
    return StorefrontProductPublic(
        id=product.id,
        name=product.name,
        description=product.description,
        price=Money(amount=amount, currency=product.currency),
        stock=product.stock,
        image_url=get_object_storage().build_public_url(product.image_key),
        tags=[
            StorefrontTagPublic(id=tag.id, name=tag.name)
            for tag in (getattr(product, "tags", None) or [])
        ],
    )


def storefront_checkout_to_public(order: Order) -> StorefrontCheckoutPublic:
    items = getattr(order, "items", []) or []
    messaging = getattr(order, "messaging", []) or []
    totals = getattr(order, "totals", None) or compute_order_totals(items, messaging)

    checkout_items: list[StorefrontCheckoutItemPublic] = []
    for item in items:
        checkout_items.append(
            StorefrontCheckoutItemPublic(
                product_id=item.product_id,
                product_name=item.product_name,
                quantity=item.quantity,
                unit_price=Money(
                    amount=item.seller_provider_price,
                    currency=item.currency,
                ),
                line_total=Money(
                    amount=item.seller_provider_price * item.quantity,
                    currency=item.currency,
                ),
            )
        )

    return StorefrontCheckoutPublic(
        order_id=order.id,
        code=order.code,
        items=checkout_items,
        totals=list(totals.total),
    )


def storefront_product_to_public(product: Product) -> StorefrontProductPublic:
    sale_price_amount = getattr(product, "sale_price", None)
    amount = sale_price_amount if sale_price_amount is not None else product.price
    return StorefrontProductPublic(
        id=product.id,
        name=product.name,
        description=product.description,
        price=Money(amount=amount, currency=product.currency),
        stock=product.stock,
        image_url=get_object_storage().build_public_url(product.image_key),
        tags=[
            StorefrontTagPublic(id=tag.id, name=tag.name)
            for tag in (getattr(product, "tags", None) or [])
        ],
    )


def storefront_checkout_to_public(order: Order) -> StorefrontCheckoutPublic:
    items = getattr(order, "items", []) or []
    messaging = getattr(order, "messaging", []) or []
    totals = getattr(order, "totals", None) or compute_order_totals(items, messaging)

    checkout_items: list[StorefrontCheckoutItemPublic] = []
    for item in items:
        checkout_items.append(
            StorefrontCheckoutItemPublic(
                product_id=item.product_id,
                product_name=item.product_name,
                quantity=item.quantity,
                unit_price=Money(
                    amount=item.seller_provider_price,
                    currency=item.currency,
                ),
                line_total=Money(
                    amount=item.seller_provider_price * item.quantity,
                    currency=item.currency,
                ),
            )
        )

    return StorefrontCheckoutPublic(
        order_id=order.id,
        code=order.code,
        items=checkout_items,
        totals=list(totals.total),
    )
