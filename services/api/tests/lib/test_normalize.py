import pytest

from app.lib.normalize import normalize_phone


@pytest.mark.parametrize(
    "test_input,expected",
    [
        ("+5353024637", "5353024637"),
        ("5353024637", "5353024637"),
        ("53024637", "5353024637"),
        ("53 5302 4637", "5353024637"),
        ("535-302-4637", "5353024637"),
        ("(53) 5302-4637", "5353024637"),
        ("+53 5 302 4637", "5353024637"),
        ("5302 4637", "5353024637"),
        ("  53024637  ", "5353024637"),
        ("", None),
        ("   ", None),
        ("abc", None),
        (None, None),
    ],
)
def test_normalize_phone(test_input, expected):
    assert normalize_phone(test_input) == expected
