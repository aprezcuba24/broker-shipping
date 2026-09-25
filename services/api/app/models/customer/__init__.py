from sqlmodel import SQLModel

from app.models.customer.address import Address
from app.models.customer.customer import Customer
from app.models.customer.phone_blacklist import PhoneBlacklist

DOMAIN_MODELS: tuple[type[SQLModel], ...] = (Address, Customer, PhoneBlacklist)

__all__ = [
    "DOMAIN_MODELS",
    "Address",
    "Customer",
    "PhoneBlacklist",
]
