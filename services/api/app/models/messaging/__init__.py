from sqlmodel import SQLModel

from app.models.messaging.provider_messaging_price import ProviderMessagingPrice

DOMAIN_MODELS: tuple[type[SQLModel], ...] = (ProviderMessagingPrice,)

__all__ = [
    "DOMAIN_MODELS",
    "ProviderMessagingPrice",
]
