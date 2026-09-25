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
    if value is None:
        return None
    stripped = value.strip().removeprefix("+")
    if len(stripped) == 8:
        return f"53{stripped}"
    return stripped
