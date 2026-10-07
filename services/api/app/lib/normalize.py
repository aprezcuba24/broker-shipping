import re
from urllib.parse import urlparse

_FACEBOOK_GROUP_PATH_RE = re.compile(r"/groups/([^/?#]+)", re.IGNORECASE)


def normalize_email(email: str) -> str:
    return email.strip().lower()


def strip_required(value: str) -> str:
    stripped = value.strip()
    if not stripped:
        raise ValueError("must not be empty")
    return stripped


def strip_optional(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def normalize_phone(value: str | None) -> str | None:
    """Normalize a phone to digits only; prefix ``53`` for bare 8-digit numbers."""
    if value is None:
        return None
    digits = "".join(ch for ch in value if ch.isdigit())
    if not digits:
        return None
    if len(digits) == 8:
        return f"53{digits}"
    return digits


def normalize_facebook_group_id(value: str) -> str:
    """Accept a raw Facebook group id or a group URL; always return the id."""
    stripped = strip_required(value)
    looks_like_url = "://" in stripped or "facebook.com" in stripped.lower()
    if looks_like_url:
        parsed = urlparse(
            stripped if "://" in stripped else f"https://{stripped}",
        )
        host = (parsed.hostname or "").lower()
        if not host.endswith("facebook.com"):
            raise ValueError("invalid Facebook group URL")
        match = _FACEBOOK_GROUP_PATH_RE.search(parsed.path)
        if match is None:
            raise ValueError("invalid Facebook group URL")
        group_id = match.group(1).strip()
    else:
        group_id = stripped
    if not group_id:
        raise ValueError("must not be empty")
    if len(group_id) > 255:
        raise ValueError("must be at most 255 characters")
    return group_id
