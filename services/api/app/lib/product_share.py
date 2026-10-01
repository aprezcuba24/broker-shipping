"""Product share codes: channel prefix + product public_code."""

from __future__ import annotations

from app.models.product.enums import ShareChannel

_CHANNEL_PREFIXES = {member.value.upper() for member in ShareChannel}


def build_product_share_code(channel: ShareChannel, public_code: str) -> str:
    return f"{channel.value}-{public_code}"


def extract_public_code_from_search(term: str) -> str:
    """Return the product code portion of a search term.

    Known share-channel prefixes (``IG-``, ``FB-``, …) are stripped so that
    ``ig-4f2k`` and ``4F2K`` both resolve to ``4f2k``. Unknown prefixes are
    left intact.
    """
    trimmed = term.strip()
    if not trimmed:
        return trimmed
    prefix, sep, remainder = trimmed.partition("-")
    if sep and prefix.upper() in _CHANNEL_PREFIXES and remainder:
        return remainder.strip()
    return trimmed
