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
