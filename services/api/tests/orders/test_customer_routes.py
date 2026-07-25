import pytest
import pytest_asyncio
from httpx import AsyncClient

from tests.factories.auth_helpers import bearer_headers, tenant_headers
from tests.factories.customer_factory import CustomerFactory
from tests.factories.organization_factory import OrganizationFactory
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


@pytest_asyncio.fixture
async def seller_org_context(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> dict:
    provider_user = await user_factory.build(username="cust_prov")
    seller_user = await user_factory.build(username="cust_sell")
    provider_org = await organization_factory.build(user_id=provider_user["id"])

    r_inv = await client.post(
        f"/organizations/{provider_org['id']}/seller-invitations",
        headers=bearer_headers(user_id=provider_user["id"]),
    )
    assert r_inv.status_code == 201
    token = r_inv.json()["token"]

    r_acc = await client.post(
        "/organizations/invitations/accept-by-token",
        json={"token": token},
        headers=bearer_headers(user_id=seller_user["id"]),
    )
    assert r_acc.status_code == 200
    seller_org_id = r_acc.json()["organization_id"]

    return {
        "seller_org_id": seller_org_id,
        "seller_headers": tenant_headers(
            user_id=seller_user["id"],
            organization_id=seller_org_id,
        ),
        "other_seller_user": await user_factory.build(username="cust_other"),
    }


async def test_list_customers_returns_org_scoped_only(
    client: AsyncClient,
    customer_factory: CustomerFactory,
    seller_org_context: dict,
    organization_factory: OrganizationFactory,
) -> None:
    ctx = seller_org_context
    await customer_factory.build(
        organization_id=ctx["seller_org_id"],
        name="Alice",
        phone="+53555111111",
        identification="ID-A",
    )
    other_org = await organization_factory.build(user_id=ctx["other_seller_user"]["id"])
    await customer_factory.build(
        organization_id=other_org["id"],
        name="Bob",
        phone="+53555222222",
        identification="ID-B",
    )

    r = await client.get("/orders/customers/", headers=ctx["seller_headers"])
    assert r.status_code == 200
    body = r.json()
    assert len(body) == 1
    assert body[0]["name"] == "Alice"


async def test_search_customers_by_name_phone_or_identification(
    client: AsyncClient,
    customer_factory: CustomerFactory,
    seller_org_context: dict,
) -> None:
    ctx = seller_org_context
    await customer_factory.build(
        organization_id=ctx["seller_org_id"],
        name="Maria Lopez",
        phone="+53555333333",
        identification="97010112345",
    )

    for query in ("Maria", "5333", "970101"):
        r = await client.get(
            f"/orders/customers/?q={query}",
            headers=ctx["seller_headers"],
        )
        assert r.status_code == 200
        assert len(r.json()) == 1
        assert r.json()[0]["name"] == "Maria Lopez"


async def test_list_customers_unknown_filter_param_returns_422(
    client: AsyncClient,
    seller_org_context: dict,
) -> None:
    r = await client.get(
        "/orders/customers/",
        params={"foo": "bar"},
        headers=seller_org_context["seller_headers"],
    )
    assert r.status_code == 422


async def test_get_customer_includes_addresses(
    client: AsyncClient,
    customer_factory: CustomerFactory,
    seller_org_context: dict,
) -> None:
    ctx = seller_org_context
    data = await customer_factory.build_with_address(
        organization_id=ctx["seller_org_id"],
        name="Pedro",
    )
    customer_id = data["customer"]["id"]

    r = await client.get(
        f"/orders/customers/{customer_id}",
        headers=ctx["seller_headers"],
    )
    assert r.status_code == 200
    body = r.json()
    assert body["name"] == "Pedro"
    assert len(body["addresses"]) == 1
    assert body["addresses"][0]["is_active"] is True


async def test_get_customer_cross_org_returns_404(
    client: AsyncClient,
    customer_factory: CustomerFactory,
    seller_org_context: dict,
    organization_factory: OrganizationFactory,
) -> None:
    ctx = seller_org_context
    other_org = await organization_factory.build(user_id=ctx["other_seller_user"]["id"])
    customer = await customer_factory.build(organization_id=other_org["id"])

    r = await client.get(
        f"/orders/customers/{customer['id']}",
        headers=ctx["seller_headers"],
    )
    assert r.status_code == 404
