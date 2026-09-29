from uuid import UUID

from fastapi import APIRouter

from app.deps import SessionDep
from app.lib.security.deps import CurrentUserDep
from app.schemas.location import (
    MunicipalityPublic,
    NeighborhoodPublic,
    ProvincePublic,
)
from app.services import location as location_service

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("/provinces", response_model=list[ProvincePublic])
async def list_provinces(
    _user: CurrentUserDep,
    session: SessionDep,
    name: str | None = None,
) -> list[ProvincePublic]:
    provinces = await location_service.list_provinces(session, name=name)
    return [ProvincePublic.model_validate(p) for p in provinces]


@router.get(
    "/provinces/{province_id}/municipalities",
    response_model=list[MunicipalityPublic],
)
async def list_municipalities(
    province_id: UUID,
    _user: CurrentUserDep,
    session: SessionDep,
    name: str | None = None,
) -> list[MunicipalityPublic]:
    municipalities = await location_service.list_municipalities_for_province(
        session,
        province_id,
        name=name,
    )
    return [MunicipalityPublic.model_validate(m) for m in municipalities]


@router.get(
    "/municipalities/{municipality_id}/neighborhoods",
    response_model=list[NeighborhoodPublic],
)
async def list_neighborhoods_for_municipality(
    municipality_id: UUID,
    _user: CurrentUserDep,
    session: SessionDep,
    name: str | None = None,
) -> list[NeighborhoodPublic]:
    neighborhoods = await location_service.list_neighborhoods_for_municipality(
        session,
        municipality_id,
        name=name,
    )
    return await location_service.enrich_neighborhoods(session, neighborhoods)
