from typing import Annotated

from pydantic import AfterValidator, EmailStr

from app.lib.normalize import (
    normalize_email,
    normalize_phone,
    strip_optional,
    strip_required,
)


def _normalize_phone_required(value: str) -> str:
    normalized = normalize_phone(strip_required(value))
    if normalized is None:
        raise ValueError("invalid phone number")
    return normalized


NormalizedEmail = Annotated[EmailStr, AfterValidator(lambda v: normalize_email(str(v)))]
NonEmptyStr = Annotated[str, AfterValidator(strip_required)]
OptionalStrippedStr = Annotated[str | None, AfterValidator(strip_optional)]
NormalizedPhone = Annotated[str, AfterValidator(_normalize_phone_required)]
