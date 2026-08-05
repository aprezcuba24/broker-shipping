from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.commission.commission import Commission
from app.models.order.order import Order
from app.models.order.order_item import OrderItem
from app.models.organization.enums import InvitationKind, InvitationStatus
from app.models.organization.organization_invitation import OrganizationInvitation
from app.models.organization.provider_seller_link import ProviderSellerLink
from app.models.product.product import Product
from app.schemas.dashboard import ProviderDashboardPublic
from app.services.dashboard import helpers as dash
from app.services.order.provider import provider_order_visibility_clause
from app.types import DashboardPeriod


async def get_provider_dashboard(
    session: AsyncSession,
    provider_organization_id: UUID,
    *,
    period: DashboardPeriod = "30d",
) -> ProviderDashboardPublic:
    period_start = dash.resolve_period_start(period)
    order_filter = provider_order_visibility_clause(provider_organization_id)
    item_filter = OrderItem.provider_organization_id == provider_organization_id
    commission_filter = Commission.provider_organization_id == provider_organization_id

    orders_by_status = await dash.count_orders_by_status(
        session,
        base_where=order_filter,
        period_start=period_start,
    )
    items_by_status = await _count_provider_items_by_status(
        session,
        provider_organization_id,
        period_start,
    )
    sales_by_currency = await dash.sum_sales_by_currency(
        session,
        order_filter=order_filter,
        item_extra_filter=item_filter,
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

    products_total = int(
        await session.scalar(
            select(func.count()).where(
                Product.organization_id == provider_organization_id
            )
        )
        or 0
    )
    linked_sellers_total = int(
        await session.scalar(
            select(func.count()).where(
                ProviderSellerLink.provider_organization_id == provider_organization_id,
                ProviderSellerLink.is_active.is_(True),
            )
        )
        or 0
    )
    pending_link_requests = int(
        await session.scalar(
            select(func.count()).where(
                OrganizationInvitation.organization_id == provider_organization_id,
                OrganizationInvitation.kind == InvitationKind.seller_link_request,
                OrganizationInvitation.status == InvitationStatus.pending,
            )
        )
        or 0
    )

    active_counts = await dash.count_orders_by_status(
        session,
        base_where=order_filter,
        period_start=None,
    )
    orders_active = dash.orders_active_from_status_counts(active_counts)
    items_pending_action = dash.items_pending_from_status_counts(items_by_status)

    recent_orders = await dash.list_recent_orders(
        session,
        base_where=order_filter,
        provider_organization_id=provider_organization_id,
    )
    recent_pending_commissions = await dash.list_recent_pending_commissions(
        session,
        org_filter=commission_filter,
    )

    return ProviderDashboardPublic(
        period=period,
        period_start=period_start,
        orders_active=orders_active,
        orders_by_status=orders_by_status,
        items_by_status=items_by_status,
        items_pending_action=items_pending_action,
        products_total=products_total,
        linked_sellers_total=linked_sellers_total,
        pending_link_requests=pending_link_requests,
        sales_by_currency=sales_by_currency,
        commissions_pending=commissions_pending,
        commissions_paid=commissions_paid,
        recent_orders=recent_orders,
        recent_pending_commissions=recent_pending_commissions,
    )


async def _count_provider_items_by_status(
    session: AsyncSession,
    provider_organization_id: UUID,
    period_start,
):
    stmt = (
        select(OrderItem.status, func.count())
        .join(Order, Order.id == OrderItem.order_id)
        .join(
            ProviderSellerLink,
            (ProviderSellerLink.seller_organization_id == Order.seller_organization_id)
            & (
                ProviderSellerLink.provider_organization_id
                == provider_organization_id
            ),
        )
        .where(
            OrderItem.provider_organization_id == provider_organization_id,
            ProviderSellerLink.is_active.is_(True),
        )
        .group_by(OrderItem.status)
    )
    stmt = dash.apply_created_at_since(stmt, Order.created_at, period_start)
    result = await session.execute(stmt)
    return dash.fill_status_counts(
        [(row[0], row[1]) for row in result.all()],
        dash._ITEM_STATUSES,
    )
