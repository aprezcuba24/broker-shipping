from sqlmodel import SQLModel

from app.models.location.municipality import Municipality
from app.models.location.neighborhood import Neighborhood
from app.models.location.province import Province

DOMAIN_MODELS: tuple[type[SQLModel], ...] = (Province, Municipality, Neighborhood)

__all__ = [
    "DOMAIN_MODELS",
    "Municipality",
    "Neighborhood",
    "Province",
]
