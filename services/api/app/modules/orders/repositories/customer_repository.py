from uuid import UUID

from sqlalchemy import or_, select

from app.lib.persistence import OrgScopedRepositoryMixin
from app.modules.orders.models.customer import Customer


class CustomerRepository(OrgScopedRepositoryMixin[Customer]):
    async def find_collisions(
        self,
        organization_id: UUID,
        *,
        phone: str,
        identification: str,
    ) -> Customer | None:
        result = await self._session.execute(
            select(Customer).where(
                Customer.organization_id == organization_id,
                or_(
                    Customer.phone == phone,
                    Customer.identification == identification,
                ),
            ),
        )
        return result.scalar_one_or_none()
