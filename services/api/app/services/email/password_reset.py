"""Password recovery message."""

from __future__ import annotations

from app.branding import PRODUCT_NAME
from app.config import settings
from app.services.email.transport import _send


def _expiry_phrase() -> str:
    hours = settings.password_reset_token_hours
    if hours == 1:
        return "una hora"
    return f"{hours} horas"


async def send_password_reset_email(*, to: str, name: str, reset_url: str) -> None:
    await _send(
        to=to,
        subject=f"Recupera tu contraseña — {PRODUCT_NAME}",
        body=(
            f"Hola {name},\n\n"
            f"Recibimos una solicitud para restablecer tu contraseña en {PRODUCT_NAME}. "
            "Abre este enlace para elegir una nueva:\n\n"
            f"{reset_url}\n\n"
            "Si no pediste este cambio, puedes ignorar este mensaje. "
            f"El enlace caduca en {_expiry_phrase()}.\n"
        ),
    )
