"""Outbound email via SMTP (MailHog in local development)."""

from __future__ import annotations

import logging
from email.message import EmailMessage

import aiosmtplib

from app.config import settings

logger = logging.getLogger(__name__)


async def _send(*, to: str, subject: str, body: str) -> None:
    message = EmailMessage()
    message["From"] = settings.mail_from
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)

    kwargs: dict[str, object] = {
        "hostname": settings.smtp_host,
        "port": settings.smtp_port,
        "use_tls": settings.smtp_use_tls,
    }
    if settings.smtp_user:
        kwargs["username"] = settings.smtp_user
        kwargs["password"] = settings.smtp_password

    await aiosmtplib.send(message, **kwargs)
    logger.info("Email sent to %s subject=%s", to, subject)


async def send_verification_email(*, to: str, name: str, verify_url: str) -> None:
    await _send(
        to=to,
        subject="Confirma tu correo — Broker",
        body=(
            f"Hola {name},\n\n"
            "Gracias por registrarte en Broker. Confirma tu correo abriendo este enlace:\n\n"
            f"{verify_url}\n\n"
            "Si no creaste esta cuenta, puedes ignorar este mensaje.\n"
        ),
    )


async def send_member_invitation_email(
    *,
    to: str,
    organization_name: str,
    accept_url: str,
) -> None:
    await _send(
        to=to,
        subject=f"Invitación a {organization_name} — Broker",
        body=(
            f"Has sido invitado a unirte a la organización «{organization_name}» en Broker.\n\n"
            "Abre este enlace para aceptar la invitación (debes iniciar sesión con este correo):\n\n"
            f"{accept_url}\n\n"
            "Si no esperabas esta invitación, puedes ignorar este mensaje.\n"
        ),
    )


async def send_seller_link_invitation_email(
    *,
    to: str,
    provider_organization_name: str,
    accept_url: str,
) -> None:
    await _send(
        to=to,
        subject=f"Invitación de enlace comercial — {provider_organization_name}",
        body=(
            f"La organización proveedora «{provider_organization_name}» te invita a "
            "enlazar tu organización vendedora en Broker.\n\n"
            "Abre este enlace para aceptar (necesitas una cuenta de vendedor con organización):\n\n"
            f"{accept_url}\n\n"
            "Si no esperabas esta invitación, puedes ignorar este mensaje.\n"
        ),
    )


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
            f"con «{provider_organization_name}» en Broker.\n\n"
            "Revisa y aprueba o rechaza la solicitud aquí:\n\n"
            f"{review_url}\n"
        ),
    )
