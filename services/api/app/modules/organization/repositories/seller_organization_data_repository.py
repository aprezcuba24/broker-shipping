from uuid import UUID

from sqlalchemy.dialects.postgresql import insert

from app.lib.persistence import Resource
from app.modules.organization.models.seller_organization_data import (
    SellerOrganizationData,
)


class SellerOrganizationDataRepository(Resource[SellerOrganizationData]):
    async def allocate_invoice_number(self, seller_organization_id: UUID) -> int:
        stmt = (
            insert(SellerOrganizationData)
            .values(
                seller_organization_id=seller_organization_id,
                last_invoice_number=1,
            )
            .on_conflict_do_update(
                index_elements=[SellerOrganizationData.seller_organization_id],
                set_={
                    "last_invoice_number": SellerOrganizationData.last_invoice_number
                    + 1,
                },
            )
            .returning(SellerOrganizationData.last_invoice_number)
        )
        result = await self._session.execute(stmt)
        return int(result.scalar_one())
