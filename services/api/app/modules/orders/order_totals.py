from collections.abc import Sequence

from app.modules.orders.models.order_line import OrderLine


def compute_order_product_price(lines: Sequence[OrderLine]) -> int:
    return sum(line.product_price * line.quantity for line in lines)


def compute_order_price(lines: Sequence[OrderLine]) -> int:
    return sum(line.price * line.quantity for line in lines)
