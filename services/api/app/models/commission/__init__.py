from sqlmodel import SQLModel

from app.models.commission.commission import Commission
from app.models.commission.commission_amount import CommissionAmount

DOMAIN_MODELS: tuple[type[SQLModel], ...] = (Commission, CommissionAmount)

__all__ = [
    "DOMAIN_MODELS",
    "Commission",
    "CommissionAmount",
]
