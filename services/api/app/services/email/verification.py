"""Email verification message."""

from __future__ import annotations

from app.services.email.transport import _send


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
