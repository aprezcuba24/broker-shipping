from typing import Annotated

from pydantic import AfterValidator, EmailStr

from app.lib.normalize import (
    normalize_email,
    normalize_phone,
    strip_optional,
    strip_required,
)

# Digits or common phone separators only (rejects emails / letters).
_PHONE_INPUT_CHARS = frozenset("0123456789+()- ")


def _assert_phone_input_shape(value: str) -> str:
    if any(ch not in _PHONE_INPUT_CHARS for ch in value):
        raise ValueError("invalid phone number")
    return value


def _assert_normalized_phone_length(normalized: str) -> str:
    # After normalize_phone, 8-digit locals become 10 (53 + 8). E.164 max is 15.
    if not (10 <= len(normalized) <= 15):
        raise ValueError("invalid phone number")
    return normalized


def _normalize_phone_required(value: str) -> str:
    stripped = strip_required(value)
    _assert_phone_input_shape(stripped)
    normalized = normalize_phone(stripped)
    if normalized is None:
        raise ValueError("invalid phone number")
    return _assert_normalized_phone_length(normalized)


def _normalize_phone_optional(value: str | None) -> str | None:
    stripped = strip_optional(value)
    if stripped is None:
        return None
    _assert_phone_input_shape(stripped)
    normalized = normalize_phone(stripped)
    if normalized is None:
        raise ValueError("invalid phone number")
    return _assert_normalized_phone_length(normalized)


NormalizedEmail = Annotated[EmailStr, AfterValidator(lambda v: normalize_email(str(v)))]
NonEmptyStr = Annotated[str, AfterValidator(strip_required)]
OptionalStrippedStr = Annotated[str | None, AfterValidator(strip_optional)]
NormalizedPhone = Annotated[str, AfterValidator(_normalize_phone_required)]
OptionalNormalizedPhone = Annotated[
    str | None, AfterValidator(_normalize_phone_optional)
]
