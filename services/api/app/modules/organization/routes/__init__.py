from fastapi import APIRouter

from . import api_key, membership, organization, seller_organization

router = APIRouter()
router.include_router(membership.router)
router.include_router(organization.router)
router.include_router(api_key.router)
router.include_router(seller_organization.router, prefix="/seller")
