"""Product share codes: channel prefix + product public_code."""

from __future__ import annotations

from app.models.product.enums import ShareChannel


def build_product_share_code(channel: ShareChannel, public_code: str) -> str:
    return f"{channel.value}-{public_code}"
