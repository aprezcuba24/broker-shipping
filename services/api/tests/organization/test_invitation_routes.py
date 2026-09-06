from __future__ import annotations

import pytest
from httpx import AsyncClient

from tests.factories.auth_helpers import bearer_headers
from tests.factories.organization_factory import OrganizationFactory
from tests.factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio(loop_scope="session")


@pytest.fixture
def mock_invitation_emails(monkeypatch: pytest.MonkeyPatch) -> list[dict[str, str]]:
    sent: list[dict[str, str]] = []

    async def _member(*, to: str, organization_name: str, accept_url: str) -> None:
        sent.append(
            {
                "kind": "member",
                "to": to,
                "organization_name": organization_name,
                "accept_url": accept_url,
            }
        )

    async def _request(
        *,
        to: str,
        provider_organization_name: str,
        seller_organization_name: str,
        review_url: str,
    ) -> None:
        sent.append(
            {
                "kind": "request",
                "to": to,
                "provider_organization_name": provider_organization_name,
                "seller_organization_name": seller_organization_name,
                "review_url": review_url,
            }
        )

    async def _emit_sync(event: object, *, background: bool = False) -> None:
        from app.lib.events import get_bus

        await get_bus().emit(event, background=False)

    monkeypatch.setattr("app.services.invitation.emit", _emit_sync)
    monkeypatch.setattr(
        "app.events.handlers.email.send_member_invitation_email",
        _member,
    )
    monkeypatch.setattr(
        "app.events.handlers.email.send_seller_link_request_email",
        _request,
    )
    return sent


async def test_create_organization_onboarding(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    user = await user_factory.build(email="owner@example.com")
    response = await client.post(
        "/organizations/",
        json={"name": "Mi Proveedor", "type": "provider"},
        headers=bearer_headers(user_id=user["id"]),
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Mi Proveedor"
    assert body["type"] == "provider"

    listed = await client.get(
        "/organizations/",
        headers=bearer_headers(user_id=user["id"]),
    )
    assert listed.status_code == 200
    assert len(listed.json()) == 1


async def test_create_second_organization_same_type_allowed(
    client: AsyncClient,
    user_factory: UserFactory,
) -> None:
    user = await user_factory.build(email="multi@example.com")
    headers = bearer_headers(user_id=user["id"])
    r1 = await client.post(
        "/organizations/",
        json={"name": "Org A", "type": "provider"},
        headers=headers,
    )
    r2 = await client.post(
        "/organizations/",
        json={"name": "Org B", "type": "provider"},
        headers=headers,
    )
    assert r1.status_code == 201
    assert r2.status_code == 201
    listed = await client.get("/organizations/", headers=headers)
    assert len(listed.json()) == 2


async def test_member_invite_email_and_accept(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    mock_invitation_emails: list[dict[str, str]],
) -> None:
    owner = await user_factory.build(email="owner2@example.com")
    invitee = await user_factory.build(email="invitee@example.com")
    org = await organization_factory.build(user_id=owner["id"], name="Staff Org")

    create = await client.post(
        f"/organizations/{org['id']}/member-invitations",
        json={"invitee_email": "invitee@example.com"},
        headers=bearer_headers(user_id=owner["id"]),
    )
    assert create.status_code == 201
    token = create.json()["token"]
    assert token
    assert len(mock_invitation_emails) == 1
    assert mock_invitation_emails[0]["to"] == "invitee@example.com"
    assert "/accept-invitation?token=" in mock_invitation_emails[0]["accept_url"]

    wrong = await client.post(
        "/organizations/invitations/accept-by-token",
        json={"token": token},
        headers=bearer_headers(user_id=owner["id"]),
    )
    assert wrong.status_code == 403

    accept = await client.post(
        "/organizations/invitations/accept-by-token",
        json={"token": token},
        headers=bearer_headers(user_id=invitee["id"]),
    )
    assert accept.status_code == 200
    assert accept.json()["organization_id"] == org["id"]
    assert accept.json()["is_active"] is True

    orgs = await client.get(
        "/users/my-organizations",
        headers=bearer_headers(user_id=invitee["id"]),
    )
    assert orgs.status_code == 200
    assert any(o["id"] == org["id"] for o in orgs.json())


async def test_seller_link_request_email_and_accept_reject(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    mock_invitation_emails: list[dict[str, str]],
) -> None:
    provider_user = await user_factory.build(email="prov@req.com")
    seller_user = await user_factory.build(email="sell@req.com")
    provider_org = await organization_factory.build(user_id=provider_user["id"])
    seller_org = await organization_factory.build_seller(user_id=seller_user["id"])

    request = await client.post(
        f"/organizations/seller/{provider_org['id']}/seller-link-requests",
        params={"seller_organization_id": seller_org["id"]},
        headers=bearer_headers(user_id=seller_user["id"]),
    )
    assert request.status_code == 201
    inv_id = request.json()["id"]
    assert any(e["kind"] == "request" for e in mock_invitation_emails)
    assert any(e["to"] == "prov@req.com" for e in mock_invitation_emails)

    duplicate = await client.post(
        f"/organizations/seller/{provider_org['id']}/seller-link-requests",
        params={"seller_organization_id": seller_org["id"]},
        headers=bearer_headers(user_id=seller_user["id"]),
    )
    assert duplicate.status_code == 409

    accept = await client.post(
        f"/organizations/provider/{provider_org['id']}/invitations/{inv_id}/accept",
        headers=bearer_headers(user_id=provider_user["id"]),
    )
    assert accept.status_code == 200
    assert accept.json()["is_active"] is True


async def test_seller_link_request_reject(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    mock_invitation_emails: list[dict[str, str]],
) -> None:
    provider_user = await user_factory.build(email="prov@rej.com")
    seller_user = await user_factory.build(email="sell@rej.com")
    provider_org = await organization_factory.build(user_id=provider_user["id"])
    seller_org = await organization_factory.build_seller(user_id=seller_user["id"])

    request = await client.post(
        f"/organizations/seller/{provider_org['id']}/seller-link-requests",
        params={"seller_organization_id": seller_org["id"]},
        headers=bearer_headers(user_id=seller_user["id"]),
    )
    inv_id = request.json()["id"]

    reject = await client.post(
        f"/organizations/provider/{provider_org['id']}/invitations/{inv_id}/reject",
        headers=bearer_headers(user_id=provider_user["id"]),
    )
    assert reject.status_code == 200
    assert reject.json()["status"] == "rejected"


async def test_list_pending_member_invitations(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    mock_invitation_emails: list[dict[str, str]],
) -> None:
    owner = await user_factory.build(email="owner@list.com")
    org = await organization_factory.build(user_id=owner["id"])
    headers = bearer_headers(user_id=owner["id"])

    create = await client.post(
        f"/organizations/{org['id']}/member-invitations",
        json={"invitee_email": "pending@example.com"},
        headers=headers,
    )
    assert create.status_code == 201
    inv_id = create.json()["id"]

    listed = await client.get(
        f"/organizations/{org['id']}/member-invitations",
        headers=headers,
    )
    assert listed.status_code == 200
    body = listed.json()
    assert len(body) == 1
    assert body[0]["id"] == inv_id
    assert body[0]["invitee_email"] == "pending@example.com"
    assert body[0]["kind"] == "member_invite"
    assert body[0]["status"] == "pending"

    members = await client.get(
        f"/organizations/{org['id']}/members",
        headers=headers,
    )
    assert members.status_code == 200
    member_body = members.json()
    assert len(member_body) == 1
    assert member_body[0]["email"] == "owner@list.com"
    assert member_body[0]["name"]

    cancel = await client.delete(
        f"/organizations/{org['id']}/invitations/{inv_id}",
        headers=headers,
    )
    assert cancel.status_code == 204

    listed_after = await client.get(
        f"/organizations/{org['id']}/member-invitations",
        headers=headers,
    )
    assert listed_after.status_code == 200
    assert listed_after.json() == []


async def test_cancel_member_invite(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    mock_invitation_emails: list[dict[str, str]],
) -> None:
    owner = await user_factory.build(email="owner@cancel.com")
    org = await organization_factory.build(user_id=owner["id"])
    create = await client.post(
        f"/organizations/{org['id']}/member-invitations",
        json={"invitee_email": "someone@example.com"},
        headers=bearer_headers(user_id=owner["id"]),
    )
    inv_id = create.json()["id"]
    token = create.json()["token"]

    cancel = await client.delete(
        f"/organizations/{org['id']}/invitations/{inv_id}",
        headers=bearer_headers(user_id=owner["id"]),
    )
    assert cancel.status_code == 204

    accept = await client.post(
        "/organizations/invitations/accept-by-token",
        json={"token": token},
        headers=bearer_headers(user_id=owner["id"]),
    )
    assert accept.status_code == 400


async def test_non_member_cannot_invite(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
    mock_invitation_emails: list[dict[str, str]],
) -> None:
    owner = await user_factory.build(email="owner@forbid.com")
    stranger = await user_factory.build(email="stranger@forbid.com")
    org = await organization_factory.build(user_id=owner["id"])

    response = await client.post(
        f"/organizations/{org['id']}/member-invitations",
        json={"invitee_email": "x@example.com"},
        headers=bearer_headers(user_id=stranger["id"]),
    )
    assert response.status_code == 403


async def test_get_invite_provider_public(
    client: AsyncClient,
    user_factory: UserFactory,
    organization_factory: OrganizationFactory,
) -> None:
    from uuid import uuid4

    provider_user = await user_factory.build(email="prov@invite-lookup.com")
    seller_user = await user_factory.build(email="sell@invite-lookup.com")
    provider_org = await organization_factory.build(
        user_id=provider_user["id"],
        name="Proveedor Público",
    )
    seller_org = await organization_factory.build_seller(user_id=seller_user["id"])

    ok = await client.get(
        f"/organizations/seller/invite-providers/{provider_org['id']}",
    )
    assert ok.status_code == 200
    body = ok.json()
    assert body["id"] == provider_org["id"]
    assert body["name"] == "Proveedor Público"
    assert body["type"] == "provider"

    seller_lookup = await client.get(
        f"/organizations/seller/invite-providers/{seller_org['id']}",
    )
    assert seller_lookup.status_code == 404

    missing = await client.get(
        f"/organizations/seller/invite-providers/{uuid4()}",
    )
    assert missing.status_code == 404
