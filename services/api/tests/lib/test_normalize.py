import pytest

from app.lib.normalize import (
    FACEBOOK_GROUP_URL_PREFIX,
    facebook_group_url,
    normalize_facebook_group_id,
    normalize_phone,
)


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


@pytest.mark.parametrize(
    "test_input,expected",
    [
        ("1090187050273078", "1090187050273078"),
        (" 1090187050273078 ", "1090187050273078"),
        (
            "https://www.facebook.com/groups/1090187050273078",
            "1090187050273078",
        ),
        (
            "https://www.facebook.com/groups/1090187050273078/",
            "1090187050273078",
        ),
        (
            "https://www.facebook.com/groups/1090187050273078/?ref=share",
            "1090187050273078",
        ),
        (
            "facebook.com/groups/1090187050273078",
            "1090187050273078",
        ),
        (
            "https://m.facebook.com/groups/1090187050273078",
            "1090187050273078",
        ),
    ],
)
def test_normalize_facebook_group_id(test_input, expected):
    assert normalize_facebook_group_id(test_input) == expected


@pytest.mark.parametrize(
    "test_input",
    [
        "",
        "   ",
        "https://www.facebook.com/pages/something",
        "https://example.com/groups/123",
    ],
)
def test_normalize_facebook_group_id_rejects_invalid(test_input):
    with pytest.raises(ValueError):
        normalize_facebook_group_id(test_input)


def test_facebook_group_url_uses_prefix_constant():
    assert FACEBOOK_GROUP_URL_PREFIX == "https://www.facebook.com/groups/"
    assert facebook_group_url("1090187050273078") == (
        "https://www.facebook.com/groups/1090187050273078"
    )
