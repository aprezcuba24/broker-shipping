from sqlmodel import SQLModel

from app.models.location.municipality import Municipality
from app.models.location.province import Province

DOMAIN_MODELS: tuple[type[SQLModel], ...] = (Province, Municipality)

__all__ = [
    "DOMAIN_MODELS",
    "Municipality",
    "Province",
]
