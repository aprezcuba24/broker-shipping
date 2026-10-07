from sqlmodel import SQLModel

from app.models.ads.ads_message import AdsMessage

DOMAIN_MODELS: tuple[type[SQLModel], ...] = (AdsMessage,)

__all__ = [
    "DOMAIN_MODELS",
    "AdsMessage",
]
