import pytest

from app.lib.normalize import normalize_phone


@pytest.mark.parametrize(
    "test_input,expected",
    [
        ("+5353024637", "5353024637"),
        ("5353024637", "5353024637"),
        ("53024637", "5353024637"),
    ],
)
def test_normalize_phone(test_input, expected):
    assert normalize_phone(test_input) == expected
