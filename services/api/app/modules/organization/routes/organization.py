from fastapi import APIRouter

from app.modules.organization.deps import OrganizationServiceDep
from app.modules.organization.models import Organization

router = APIRouter()


@router.post("/", response_model=Organization, status_code=201)
async def create_organization(body: Organization, service: OrganizationServiceDep):
    return await service.create(body)
