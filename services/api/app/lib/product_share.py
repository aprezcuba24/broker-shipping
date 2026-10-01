"""Product share codes: channel prefix + product public_code."""

from __future__ import annotations

from app.models.product.enums import ShareChannel

_CHANNEL_PREFIXES = {member.value.upper() for member in ShareChannel}
_CHANNEL_BY_PREFIX = {member.value.upper(): member for member in ShareChannel}


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


def extract_share_channel_from_search(term: str) -> ShareChannel | None:
    """Return the share channel prefix when the term uses a known ``CHANNEL-code`` form."""
    trimmed = term.strip()
    if not trimmed:
        return None
    prefix, sep, remainder = trimmed.partition("-")
    if not sep or not remainder.strip():
        return None
    return _CHANNEL_BY_PREFIX.get(prefix.upper())


def resolve_share_channel(
    share_code: str | None,
    public_code: str,
) -> ShareChannel | None:
    """Return the channel when *share_code* matches *public_code*; otherwise ``None``."""
    if share_code is None:
        return None
    channel = extract_share_channel_from_search(share_code)
    if channel is None:
        return None
    code = extract_public_code_from_search(share_code)
    if code.casefold() != public_code.casefold():
        return None
    return channel
