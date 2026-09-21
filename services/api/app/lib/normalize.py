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


def normalize_phone(value: str | None) -> str:
    if value is None:
        return None
    stripped = value.strip()
    if stripped.startswith("+53"):
        return stripped.removeprefix("+53")
    if len(stripped) == 10 and stripped.startswith("53"):
        return stripped.removeprefix("53")
    return stripped;


def all_phone_options(value: str | None):
    stripped = normalize_phone(value)
    return [f"+53{stripped}", f"53{stripped}", stripped]
