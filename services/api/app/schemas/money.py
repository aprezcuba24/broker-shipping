from pydantic import BaseModel, Field

from app.models.order.enums import Currency


class Money(BaseModel):
    """Monetary value in integer cents with its currency."""

    amount: int = Field(ge=0)
    currency: Currency
