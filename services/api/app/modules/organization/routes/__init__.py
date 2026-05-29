from fastapi import APIRouter

from . import api_key, membership, organization

router = APIRouter()
router.include_router(membership.router)
router.include_router(organization.router)
router.include_router(api_key.router)
