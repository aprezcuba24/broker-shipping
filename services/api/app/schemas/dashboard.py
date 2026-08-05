from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.order.enums import Currency, OrderStatus
from app.schemas.order import OrderCurrencyTotal
from app.types import DashboardPeriod


class CurrencyAmount(BaseModel):
    currency: Currency
    amount: int


class StatusCount(BaseModel):
    status: str
    count: int


class OrderSummaryPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    status: OrderStatus
    created_at: datetime
    totals: list[OrderCurrencyTotal] = Field(default_factory=list)
    customer_name: str | None = None


class CommissionSummaryPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    amount: int
    currency: Currency
    provider_organization_id: UUID
    seller_organization_id: UUID
    created_at: datetime


class SellerDashboardPublic(BaseModel):
    period: DashboardPeriod
    period_start: datetime | None

    orders_active: int
    orders_by_status: list[StatusCount]
    items_by_status: list[StatusCount]
    customers_total: int
    linked_providers_total: int
    products_available_total: int
    pending_link_requests: int

    sales_by_currency: list[CurrencyAmount]
    commissions_pending: list[CurrencyAmount]
    commissions_paid: list[CurrencyAmount]

    recent_orders: list[OrderSummaryPublic]
    recent_pending_commissions: list[CommissionSummaryPublic]


class ProviderDashboardPublic(BaseModel):
    period: DashboardPeriod
    period_start: datetime | None

    orders_active: int
    orders_by_status: list[StatusCount]
    items_by_status: list[StatusCount]
    items_pending_action: int
    products_total: int
    linked_sellers_total: int
    pending_link_requests: int

    sales_by_currency: list[CurrencyAmount]
    commissions_pending: list[CurrencyAmount]
    commissions_paid: list[CurrencyAmount]

    recent_orders: list[OrderSummaryPublic]
    recent_pending_commissions: list[CommissionSummaryPublic]
