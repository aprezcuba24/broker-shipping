"""Outbound email via SMTP (MailHog in local development)."""

from __future__ import annotations

import logging
from email.message import EmailMessage

import aiosmtplib

from app.config import settings

logger = logging.getLogger(__name__)


async def send_verification_email(*, to: str, name: str, verify_url: str) -> None:
    message = EmailMessage()
    message["From"] = settings.mail_from
    message["To"] = to
    message["Subject"] = "Confirma tu correo — Broker"
    message.set_content(
        f"Hola {name},\n\n"
        "Gracias por registrarte en Broker. Confirma tu correo abriendo este enlace:\n\n"
        f"{verify_url}\n\n"
        "Si no creaste esta cuenta, puedes ignorar este mensaje.\n"
    )

    kwargs: dict[str, object] = {
        "hostname": settings.smtp_host,
        "port": settings.smtp_port,
        "use_tls": settings.smtp_use_tls,
    }
    if settings.smtp_user:
        kwargs["username"] = settings.smtp_user
        kwargs["password"] = settings.smtp_password

    await aiosmtplib.send(message, **kwargs)
    logger.info("Verification email sent to %s", to)
