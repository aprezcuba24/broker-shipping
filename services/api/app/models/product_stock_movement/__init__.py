from sqlmodel import SQLModel

from app.models.product_stock_movement.enums import (
    StockMovementDirection,
    StockMovementKind,
)
from app.models.product_stock_movement.product_stock_movement import ProductStockMovement
from app.models.product_stock_movement.product_stock_movement_item import (
    ProductStockMovementItem,
)

DOMAIN_MODELS: tuple[type[SQLModel], ...] = (
    ProductStockMovement,
    ProductStockMovementItem,
)

__all__ = [
    "DOMAIN_MODELS",
    "ProductStockMovement",
    "ProductStockMovementItem",
    "StockMovementDirection",
    "StockMovementKind",
]
