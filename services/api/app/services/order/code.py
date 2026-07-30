from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order.order import Order

ORDER_CODE_PREFIX = "O-"
ORDER_CODE_WIDTH = 5


async def generate_next_order_code(
    session: AsyncSession,
    seller_organization_id: UUID,
) -> str:
    result = await session.execute(
        select(Order.code)
        .where(
            Order.seller_organization_id == seller_organization_id,
            Order.code.like(f"{ORDER_CODE_PREFIX}%"),
        )
        .order_by(Order.code.desc())
        .limit(1)
    )
    last_code = result.scalar_one_or_none()
    if last_code is None:
        next_number = 1
    else:
        suffix = last_code.removeprefix(ORDER_CODE_PREFIX)
        try:
            next_number = int(suffix) + 1
        except ValueError:
            next_number = 1
    return f"{ORDER_CODE_PREFIX}{next_number:0{ORDER_CODE_WIDTH}d}"
