from app.lib.product_share import (
    build_product_share_code,
    extract_public_code_from_search,
    extract_share_channel_from_search,
    resolve_share_channel,
)
from app.models.product.enums import ShareChannel


def test_share_channel_values() -> None:
    assert [member.value for member in ShareChannel] == [
        "IG",
        "FB",
        "TT",
        "WA",
        "YT",
        "OT",
    ]


def test_build_product_share_code() -> None:
    assert build_product_share_code(ShareChannel.IG, "4F2K") == "IG4F2K"
    assert build_product_share_code(ShareChannel.FB, "4F2K") == "FB4F2K"


def test_extract_public_code_from_search() -> None:
    assert extract_public_code_from_search("4F2K") == "4F2K"
    assert extract_public_code_from_search("ig4f2k") == "4f2k"
    assert extract_public_code_from_search(" FB4F2K ") == "4F2K"
    assert extract_public_code_from_search("ig-4f2k") == "4f2k"
    assert extract_public_code_from_search(" IG-4F2K ") == "4F2K"
    assert extract_public_code_from_search("arroz") == "arroz"
    assert extract_public_code_from_search("XX-4F2K") == "XX-4F2K"
    assert extract_public_code_from_search("XX4F2K") == "XX4F2K"
    assert extract_public_code_from_search("IG-") == "IG-"
    assert extract_public_code_from_search("IG") == "IG"
    assert extract_public_code_from_search("") == ""


def test_extract_share_channel_from_search() -> None:
    assert extract_share_channel_from_search("ig4f2k") == ShareChannel.IG
    assert extract_share_channel_from_search(" FB4F2K ") == ShareChannel.FB
    assert extract_share_channel_from_search("ig-4f2k") == ShareChannel.IG
    assert extract_share_channel_from_search(" FB-ABCD ") == ShareChannel.FB
    assert extract_share_channel_from_search("4F2K") is None
    assert extract_share_channel_from_search("arroz") is None
    assert extract_share_channel_from_search("XX-4F2K") is None
    assert extract_share_channel_from_search("XX4F2K") is None
    assert extract_share_channel_from_search("IG-") is None
    assert extract_share_channel_from_search("IG") is None
    assert extract_share_channel_from_search("") is None


def test_resolve_share_channel() -> None:
    assert resolve_share_channel("ig4f2k", "4F2K") == ShareChannel.IG
    assert resolve_share_channel("IG4F2K", "4f2k") == ShareChannel.IG
    assert resolve_share_channel("ig-4f2k", "4F2K") == ShareChannel.IG
    assert resolve_share_channel("IG-4F2K", "4f2k") == ShareChannel.IG
    assert resolve_share_channel("4F2K", "4F2K") is None
    assert resolve_share_channel("arroz", "4F2K") is None
    assert resolve_share_channel("IGZZZZ", "4F2K") is None
    assert resolve_share_channel("IG-ZZZZ", "4F2K") is None
    assert resolve_share_channel(None, "4F2K") is None
