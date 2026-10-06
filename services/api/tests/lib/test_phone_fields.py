import pytest
from pydantic import BaseModel, ValidationError

from app.schemas.fields import NormalizedPhone, OptionalNormalizedPhone


class RequiredPhone(BaseModel):
    phone: NormalizedPhone


class OptionalPhone(BaseModel):
    phone: OptionalNormalizedPhone = None


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("55512345", "5355512345"),
        ("  +53 5 123-4567  ", "5351234567"),
        ("(53) 5551-2345", "5355512345"),
    ],
)
def test_normalized_phone_accepts_valid(raw: str, expected: str) -> None:
    assert RequiredPhone(phone=raw).phone == expected


@pytest.mark.parametrize(
    "raw",
    [
        "user@mail.com",
        "user1@mail.com",
        "abcdef",
        "1234567",
        "",
        "   ",
    ],
)
def test_normalized_phone_rejects_invalid(raw: str) -> None:
    with pytest.raises(ValidationError):
        RequiredPhone(phone=raw)


def test_optional_normalized_phone_empty_is_none() -> None:
    assert OptionalPhone(phone=None).phone is None
    assert OptionalPhone(phone="").phone is None
    assert OptionalPhone(phone="   ").phone is None


def test_optional_normalized_phone_rejects_letters() -> None:
    with pytest.raises(ValidationError):
        OptionalPhone(phone="abc")
