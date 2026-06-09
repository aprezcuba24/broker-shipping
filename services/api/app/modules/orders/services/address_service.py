from uuid import UUID

from fastapi import HTTPException

from app.lib.persistence import BaseService
from app.modules.orders.models.address import Address
from app.modules.orders.repositories.address_repository import AddressRepository
from app.modules.orders.schemas import AddressInput


class AddressService(BaseService[Address]):
    def __init__(self, repository: AddressRepository) -> None:
        super().__init__(repository)

    @classmethod
    def creation_exclude(cls) -> frozenset[str]:
        return Address.IMMUTABLE_FIELDS

    @classmethod
    def patch_allowed_keys(cls) -> frozenset[str]:
        return frozenset(Address.model_fields.keys()) - Address.IMMUTABLE_FIELDS

    async def get_for_customer_or_404(
        self,
        address_id: UUID,
        customer_id: UUID,
        *,
        detail: str = "Address not found",
    ) -> Address:
        address = await self._repo.get_for_customer(address_id, customer_id)
        if address is None:
            raise HTTPException(status_code=404, detail=detail)
        return address

    async def create_and_activate(
        self,
        customer_id: UUID,
        data: AddressInput,
    ) -> Address:
        await self._repo.deactivate_all_for_customer(customer_id)
        entity = Address(
            customer_id=customer_id,
            province=data.province,
            municipality=data.municipality,
            district=data.district,
            neighborhood=data.neighborhood,
            address=data.address,
            reference=data.reference,
            is_active=True,
        )
        return await self.create(entity)
