from __future__ import annotations

from uuid import UUID

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.commission.commission import Commission
from app.models.order.enums import Currency, OrderStatus
from app.models.order.order import Order
from tests.factories.auth_helpers import bearer_headers
from tests.factories.customer_factory import CustomerFactory
from tests.factories.organization_factory import (
    OrganizationFactory,
    link_provider_to_seller,
)
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def _linked_ctx(
    db_session: AsyncSession,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> dict:
    provider_user = await user_factory.build()
    seller_user = await user_factory.build()
    provider = await organization_factory.build(
        user_id=provider_user["id"],
        name="Linked Provider",
    )
    seller = await organization_factory.build_seller(
        user_id=seller_user["id"],
        name="Linked Seller",
    )
    await link_provider_to_seller(
        db_session,
        provider_organization_id=provider["id"],
        seller_organization_id=seller["id"],
    )
    return {
        "provider_id": provider["id"],
        "seller_id": seller["id"],
        "provider_bearer": bearer_headers(user_id=provider_user["id"]),
        "params": {"organization_id": provider["id"]},
    }


async def _add_commission(
    db_session: AsyncSession,
    customer_factory: CustomerFactory,
    *,
    provider_id: str,
    seller_id: str,
    is_paid: bool = False,
) -> Commission:
    customer = await customer_factory.build(seller_organization_id=seller_id)
    order = Order(
        code=f"LS-{UUID(seller_id).hex[:8]}",
        seller_organization_id=UUID(str(seller_id)),
        customer_id=UUID(str(customer["id"])),
        status=OrderStatus.finished,
    )
    db_session.add(order)
    await db_session.flush()
    commission = Commission(
        order_id=order.id,
        provider_organization_id=UUID(str(provider_id)),
        seller_organization_id=UUID(str(seller_id)),
        amount=500,
        currency=Currency.cup,
        is_paid=is_paid,
    )
    db_session.add(commission)
    await db_session.flush()
    await db_session.commit()
    return commission


async def test_list_linked_sellers_includes_pending_flag(
    client: AsyncClient,
    db_session: AsyncSession,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    customer_factory: CustomerFactory,
) -> None:
    ctx = await _linked_ctx(db_session, user_factory, organization_factory)
    await _add_commission(
        db_session,
        customer_factory,
        provider_id=ctx["provider_id"],
        seller_id=ctx["seller_id"],
        is_paid=False,
    )

    response = await client.get(
        f"/organizations/provider/{ctx['provider_id']}/linked-sellers",
        params=ctx["params"],
        headers=ctx["provider_bearer"],
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["id"] == ctx["seller_id"]
    assert body[0]["name"] == "Linked Seller"
    assert body[0]["has_pending_commissions"] is True


async def test_list_linked_sellers_no_pending_when_paid(
    client: AsyncClient,
    db_session: AsyncSession,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    customer_factory: CustomerFactory,
) -> None:
    ctx = await _linked_ctx(db_session, user_factory, organization_factory)
    await _add_commission(
        db_session,
        customer_factory,
        provider_id=ctx["provider_id"],
        seller_id=ctx["seller_id"],
        is_paid=True,
    )

    response = await client.get(
        f"/organizations/provider/{ctx['provider_id']}/linked-sellers",
        params=ctx["params"],
        headers=ctx["provider_bearer"],
    )
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["has_pending_commissions"] is False


async def test_unlink_blocked_when_pending_commissions(
    client: AsyncClient,
    db_session: AsyncSession,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    customer_factory: CustomerFactory,
) -> None:
    ctx = await _linked_ctx(db_session, user_factory, organization_factory)
    await _add_commission(
        db_session,
        customer_factory,
        provider_id=ctx["provider_id"],
        seller_id=ctx["seller_id"],
        is_paid=False,
    )

    response = await client.patch(
        f"/organizations/provider/{ctx['provider_id']}/linked-sellers/{ctx['seller_id']}",
        params=ctx["params"],
        headers=ctx["provider_bearer"],
        json={"is_active": False},
    )
    assert response.status_code == 409
    assert "comisiones pendientes" in response.json()["detail"]

    listed = await client.get(
        f"/organizations/provider/{ctx['provider_id']}/linked-sellers",
        params=ctx["params"],
        headers=ctx["provider_bearer"],
    )
    assert listed.status_code == 200
    assert len(listed.json()) == 1


async def test_unlink_succeeds_without_pending_commissions(
    client: AsyncClient,
    db_session: AsyncSession,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    ctx = await _linked_ctx(db_session, user_factory, organization_factory)

    response = await client.patch(
        f"/organizations/provider/{ctx['provider_id']}/linked-sellers/{ctx['seller_id']}",
        params=ctx["params"],
        headers=ctx["provider_bearer"],
        json={"is_active": False},
    )
    assert response.status_code == 204

    listed = await client.get(
        f"/organizations/provider/{ctx['provider_id']}/linked-sellers",
        params=ctx["params"],
        headers=ctx["provider_bearer"],
    )
    assert listed.status_code == 200
    assert listed.json() == []
