from sqlmodel import SQLModel

from app.models.commission.commission import Commission

DOMAIN_MODELS: tuple[type[SQLModel], ...] = (Commission,)

__all__ = [
    "DOMAIN_MODELS",
    "Commission",
]
