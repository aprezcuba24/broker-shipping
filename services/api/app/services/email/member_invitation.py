"""Member invitation email."""

from __future__ import annotations

from app.services.email.transport import _send


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
