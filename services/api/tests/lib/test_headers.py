import pytest

from app.lib.headers import get_header_value, optional_stripped_str


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        (None, None),
        ("", None),
        ("  ", None),
        (" foo ", "foo"),
        (42, "42"),
    ],
)
def test_optional_stripped_str(value: object | None, expected: str | None) -> None:
    assert optional_stripped_str(value) == expected


def test_get_header_value_returns_first_non_empty() -> None:
    headers = {"app_type": "provider_app", "x-app-type": "seller_app"}
    assert get_header_value(headers, "app_type", "x-app-type") == "provider_app"


def test_get_header_value_falls_back_to_second_name() -> None:
    headers = {"x-app-type": "seller_app"}
    assert get_header_value(headers, "app_type", "x-app-type") == "seller_app"


def test_get_header_value_returns_none_when_all_empty() -> None:
    headers = {"app_type": "  ", "x-app-type": ""}
    assert get_header_value(headers, "app_type", "x-app-type") is None


def test_get_header_value_returns_none_when_missing() -> None:
    assert get_header_value({}, "app_type", "x-app-type") is None
