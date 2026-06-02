from enum import StrEnum


class OrderLineStatus(StrEnum):
    created = "created"
    accepted = "accepted"
    processed = "processed"
    shipped = "shipped"
    delivered = "delivered"
    canceled = "canceled"


class OrderStatus(StrEnum):
    created = "created"
    processing = "processing"
    canceled = "canceled"
    finished = "finished"
