"""Product share codes: channel prefix + product public_code."""

from __future__ import annotations

from app.models.product.enums import ShareChannel

_CHANNEL_PREFIXES = {member.value.upper() for member in ShareChannel}
_CHANNEL_BY_PREFIX = {member.value.upper(): member for member in ShareChannel}


def build_product_share_code(channel: ShareChannel, public_code: str) -> str:
    return f"{channel.value}{public_code}"


def _split_share_term(term: str) -> tuple[str, str] | None:
    """Return ``(prefix, remainder)`` for a known channel share code, else ``None``.

    Accepts legacy ``CHANNEL-code`` and compact ``CHANNELcode`` forms.
    """
    trimmed = term.strip()
    if not trimmed:
        return None

    prefix, sep, remainder = trimmed.partition("-")
    if sep and prefix.upper() in _CHANNEL_PREFIXES and remainder.strip():
        return prefix.upper(), remainder.strip()

    if len(trimmed) > 2:
        compact_prefix = trimmed[:2].upper()
        compact_remainder = trimmed[2:].strip()
        if compact_prefix in _CHANNEL_PREFIXES and compact_remainder:
            return compact_prefix, compact_remainder

    return None


def extract_public_code_from_search(term: str) -> str:
    """Return the product code portion of a search term.

    Known share-channel prefixes (``IG``, ``FB``, …) are stripped so that
    ``ig4f2k``, ``ig-4f2k`` and ``4F2K`` all resolve to the product code.
    Unknown prefixes are left intact. Legacy ``CHANNEL-code`` forms are
    still accepted.
    """
    trimmed = term.strip()
    if not trimmed:
        return trimmed
    split = _split_share_term(trimmed)
    if split is not None:
        return split[1]
    return trimmed


def extract_share_channel_from_search(term: str) -> ShareChannel | None:
    """Return the share channel when the term uses a known channel+code form."""
    split = _split_share_term(term)
    if split is None:
        return None
    return _CHANNEL_BY_PREFIX.get(split[0])


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
