from enum import StrEnum


class StockMovementKind(StrEnum):
    reception = "reception"
    shrinkage = "shrinkage"
    correction = "correction"


class StockMovementDirection(StrEnum):
    in_ = "in"
    out = "out"
