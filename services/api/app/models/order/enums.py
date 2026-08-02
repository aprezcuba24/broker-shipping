from enum import StrEnum


class Currency(StrEnum):
    cup = "cup"
    usd = "usd"


class OrderStatus(StrEnum):
    created = "created"
    processing = "processing"
    finished = "finished"
    canceled = "canceled"


class OrderItemStatus(StrEnum):
    created = "created"
    reviewed = "reviewed"
    sent = "sent"
    delivered = "delivered"
    canceled = "canceled"
