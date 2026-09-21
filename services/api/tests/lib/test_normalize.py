import pytest

from app.lib.normalize import all_phone_options


@pytest.mark.parametrize(
    "test_input,expected",
    [
        ("+5353024637", ["+5353024637", "5353024637", "53024637"]),
        ("5353024637", ["+5353024637", "5353024637", "53024637"]),
        ("53024637", ["+5353024637", "5353024637", "53024637"]),
    ],
)
def test_normalize_phone(test_input, expected):
    phones = all_phone_options(test_input)
    assert phones == expected