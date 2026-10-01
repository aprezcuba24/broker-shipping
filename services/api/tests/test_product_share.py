from app.lib.product_share import (
    build_product_share_code,
    extract_public_code_from_search,
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
    assert build_product_share_code(ShareChannel.IG, "4F2K") == "IG-4F2K"
    assert build_product_share_code(ShareChannel.FB, "4F2K") == "FB-4F2K"


def test_extract_public_code_from_search() -> None:
    assert extract_public_code_from_search("4F2K") == "4F2K"
    assert extract_public_code_from_search("ig-4f2k") == "4f2k"
    assert extract_public_code_from_search(" IG-4F2K ") == "4F2K"
    assert extract_public_code_from_search("arroz") == "arroz"
    assert extract_public_code_from_search("XX-4F2K") == "XX-4F2K"
    assert extract_public_code_from_search("IG-") == "IG-"
    assert extract_public_code_from_search("") == ""
