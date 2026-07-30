from sqlmodel import SQLModel

from app.models.customer.address import Address
from app.models.customer.customer import Customer

DOMAIN_MODELS: tuple[type[SQLModel], ...] = (Address, Customer)

__all__ = [
    "DOMAIN_MODELS",
    "Address",
    "Customer",
]
