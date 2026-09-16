"""Seller link request email."""

from __future__ import annotations

from app.branding import PRODUCT_NAME
from app.services.email.transport import _send


async def send_seller_link_request_email(
    *,
    to: str,
    provider_organization_name: str,
    seller_organization_name: str,
    review_url: str,
) -> None:
    await _send(
        to=to,
        subject=f"Solicitud de enlace de «{seller_organization_name}»",
        body=(
            f"La organización vendedora «{seller_organization_name}» solicita enlazarse "
            f"con «{provider_organization_name}» en {PRODUCT_NAME}.\n\n"
            "Revisa y aprueba o rechaza la solicitud aquí:\n\n"
            f"{review_url}\n"
        ),
    )
