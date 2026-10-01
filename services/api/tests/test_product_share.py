from app.lib.product_share import build_product_share_code
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
