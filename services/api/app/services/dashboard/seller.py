from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.commission.commission import Commission
from app.models.customer.customer import Customer
from app.models.order.order import Order
from app.models.organization.enums import InvitationKind, InvitationStatus
from app.models.organization.organization_invitation import OrganizationInvitation
from app.models.organization.provider_seller_link import ProviderSellerLink
from app.models.product.product import Product
from app.models.user.user import User
from app.schemas.dashboard import SellerDashboardPublic
from app.services import provider_seller_link as link_service
from app.services.dashboard import helpers as dash
from app.types import DashboardPeriod


async def get_seller_dashboard(
    session: AsyncSession,
    user: User,
    seller_organization_id: UUID,
    *,
    period: DashboardPeriod = "30d",
) -> SellerDashboardPublic:
    period_start = dash.resolve_period_start(period)
    order_filter = Order.seller_organization_id == seller_organization_id
    commission_filter = Commission.seller_organization_id == seller_organization_id

    orders_by_status = await dash.count_orders_by_status(
        session,
        base_where=order_filter,
        period_start=period_start,
    )
    items_by_status = await dash.count_items_by_status(
        session,
        order_filter=order_filter,
        period_start=period_start,
    )
    sales_by_currency = await dash.sum_sales_by_currency(
        session,
        order_filter=order_filter,
        period_start=period_start,
    )
    commissions_pending = await dash.sum_commissions(
        session,
        org_filter=commission_filter,
        is_paid=False,
        period_start=period_start,
    )
    commissions_paid = await dash.sum_commissions(
        session,
        org_filter=commission_filter,
        is_paid=True,
        period_start=period_start,
    )

    customers_total = int(
        await session.scalar(
            select(func.count()).where(
                Customer.seller_organization_id == seller_organization_id
            )
        )
        or 0
    )
    linked_providers_total = int(
        await session.scalar(
            select(func.count()).where(
                ProviderSellerLink.seller_organization_id == seller_organization_id,
                ProviderSellerLink.is_active.is_(True),
            )
        )
        or 0
    )
    pending_link_requests = int(
        await session.scalar(
            select(func.count()).where(
                OrganizationInvitation.counterparty_organization_id
                == seller_organization_id,
                OrganizationInvitation.kind == InvitationKind.seller_link_request,
                OrganizationInvitation.status == InvitationStatus.pending,
            )
        )
        or 0
    )

    provider_ids = await link_service.resolve_provider_ids(
        session,
        user,
        seller_organization_id,
    )
    products_available_total = 0
    if provider_ids:
        products_available_total = int(
            await session.scalar(
                select(func.count()).where(Product.organization_id.in_(provider_ids))
            )
            or 0
        )

    # Active orders: currently open (not period-scoped).
    active_counts = await dash.count_orders_by_status(
        session,
        base_where=order_filter,
        period_start=None,
    )
    orders_active = dash.orders_active_from_status_counts(active_counts)

    recent_orders = await dash.list_recent_orders(
        session,
        base_where=order_filter,
    )
    recent_pending_commissions = await dash.list_recent_pending_commissions(
        session,
        org_filter=commission_filter,
    )

    return SellerDashboardPublic(
        period=period,
        period_start=period_start,
        orders_active=orders_active,
        orders_by_status=orders_by_status,
        items_by_status=items_by_status,
        customers_total=customers_total,
        linked_providers_total=linked_providers_total,
        products_available_total=products_available_total,
        pending_link_requests=pending_link_requests,
        sales_by_currency=sales_by_currency,
        commissions_pending=commissions_pending,
        commissions_paid=commissions_paid,
        recent_orders=recent_orders,
        recent_pending_commissions=recent_pending_commissions,
    )
