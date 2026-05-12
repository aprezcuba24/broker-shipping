from typing import Annotated

from fastapi import Depends

from app.lib.db_utils import make_service_depends
from app.modules.organization.repositories import OrganizationRepository
from app.modules.organization.services import OrganizationService

_get_organization_service = make_service_depends(
    OrganizationService, OrganizationRepository
)
OrganizationServiceDep = Annotated[OrganizationService, Depends(_get_organization_service)]
