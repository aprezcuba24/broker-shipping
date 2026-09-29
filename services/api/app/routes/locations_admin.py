from uuid import UUID

from fastapi import APIRouter, Response

from app.deps import SessionDep
from app.lib.persistence import get_entity
from app.lib.persistence.pagination import PaginationDep
from app.lib.security.deps import SuperAdminDep
from app.models.location.municipality import Municipality
from app.models.location.neighborhood import Neighborhood
from app.models.location.province import Province
from app.schemas.location import (
    MunicipalityCreate,
    MunicipalityPublic,
    MunicipalityUpdate,
    NeighborhoodCreate,
    NeighborhoodPublic,
    NeighborhoodUpdate,
    ProvinceCreate,
    ProvincePublic,
    ProvinceUpdate,
)
from app.schemas.pagination import Page, PageResult
from app.services import location as location_service

router = APIRouter(prefix="/locations/admin", tags=["locations-admin"])


# --- Provinces ---


@router.get("/provinces", response_model=Page[ProvincePublic])
async def admin_list_provinces(
    _admin: SuperAdminDep,
    session: SessionDep,
    pagination: PaginationDep,
    name: str | None = None,
) -> Page[ProvincePublic]:
    result = await location_service.admin_list_provinces(
        session,
        pagination=pagination,
        name=name,
    )
    return Page.from_mapped(result, pagination, ProvincePublic.model_validate)


@router.get("/provinces/{province_id}", response_model=ProvincePublic)
async def admin_get_province(
    province_id: UUID,
    _admin: SuperAdminDep,
    session: SessionDep,
) -> ProvincePublic:
    province = await get_entity(session, Province, id=province_id)
    return ProvincePublic.model_validate(province)


@router.post("/provinces", response_model=ProvincePublic, status_code=201)
async def admin_create_province(
    body: ProvinceCreate,
    _admin: SuperAdminDep,
    session: SessionDep,
) -> ProvincePublic:
    province = await location_service.create_province(session, body)
    return ProvincePublic.model_validate(province)


@router.patch("/provinces/{province_id}", response_model=ProvincePublic)
async def admin_patch_province(
    province_id: UUID,
    body: ProvinceUpdate,
    _admin: SuperAdminDep,
    session: SessionDep,
) -> ProvincePublic:
    province = await location_service.update_province(session, province_id, body)
    return ProvincePublic.model_validate(province)


@router.delete("/provinces/{province_id}", status_code=204)
async def admin_delete_province(
    province_id: UUID,
    _admin: SuperAdminDep,
    session: SessionDep,
) -> Response:
    await location_service.delete_province(session, province_id)
    return Response(status_code=204)


# --- Municipalities ---


@router.get("/municipalities", response_model=Page[MunicipalityPublic])
async def admin_list_municipalities(
    _admin: SuperAdminDep,
    session: SessionDep,
    pagination: PaginationDep,
    name: str | None = None,
    province_id: UUID | None = None,
) -> Page[MunicipalityPublic]:
    result = await location_service.admin_list_municipalities(
        session,
        pagination=pagination,
        name=name,
        province_id=province_id,
    )
    items = await location_service.enrich_municipalities(session, result.items)
    return Page.from_result(
        PageResult(items=items, total=result.total),
        pagination,
    )


@router.get("/municipalities/{municipality_id}", response_model=MunicipalityPublic)
async def admin_get_municipality(
    municipality_id: UUID,
    _admin: SuperAdminDep,
    session: SessionDep,
) -> MunicipalityPublic:
    municipality = await get_entity(session, Municipality, id=municipality_id)
    items = await location_service.enrich_municipalities(session, [municipality])
    return items[0]


@router.post("/municipalities", response_model=MunicipalityPublic, status_code=201)
async def admin_create_municipality(
    body: MunicipalityCreate,
    _admin: SuperAdminDep,
    session: SessionDep,
) -> MunicipalityPublic:
    municipality = await location_service.create_municipality(session, body)
    items = await location_service.enrich_municipalities(session, [municipality])
    return items[0]


@router.patch("/municipalities/{municipality_id}", response_model=MunicipalityPublic)
async def admin_patch_municipality(
    municipality_id: UUID,
    body: MunicipalityUpdate,
    _admin: SuperAdminDep,
    session: SessionDep,
) -> MunicipalityPublic:
    municipality = await location_service.update_municipality(
        session,
        municipality_id,
        body,
    )
    items = await location_service.enrich_municipalities(session, [municipality])
    return items[0]


@router.delete("/municipalities/{municipality_id}", status_code=204)
async def admin_delete_municipality(
    municipality_id: UUID,
    _admin: SuperAdminDep,
    session: SessionDep,
) -> Response:
    await location_service.delete_municipality(session, municipality_id)
    return Response(status_code=204)


# --- Neighborhoods ---


@router.get("/neighborhoods", response_model=Page[NeighborhoodPublic])
async def admin_list_neighborhoods(
    _admin: SuperAdminDep,
    session: SessionDep,
    pagination: PaginationDep,
    name: str | None = None,
    municipality_id: UUID | None = None,
    province_id: UUID | None = None,
) -> Page[NeighborhoodPublic]:
    result = await location_service.admin_list_neighborhoods(
        session,
        pagination=pagination,
        name=name,
        municipality_id=municipality_id,
        province_id=province_id,
    )
    items = await location_service.enrich_neighborhoods(session, result.items)
    return Page.from_result(
        PageResult(items=items, total=result.total),
        pagination,
    )


@router.get("/neighborhoods/{neighborhood_id}", response_model=NeighborhoodPublic)
async def admin_get_neighborhood(
    neighborhood_id: UUID,
    _admin: SuperAdminDep,
    session: SessionDep,
) -> NeighborhoodPublic:
    neighborhood = await get_entity(session, Neighborhood, id=neighborhood_id)
    items = await location_service.enrich_neighborhoods(session, [neighborhood])
    return items[0]


@router.post("/neighborhoods", response_model=NeighborhoodPublic, status_code=201)
async def admin_create_neighborhood(
    body: NeighborhoodCreate,
    _admin: SuperAdminDep,
    session: SessionDep,
) -> NeighborhoodPublic:
    neighborhood = await location_service.create_neighborhood(session, body)
    items = await location_service.enrich_neighborhoods(session, [neighborhood])
    return items[0]


@router.patch("/neighborhoods/{neighborhood_id}", response_model=NeighborhoodPublic)
async def admin_patch_neighborhood(
    neighborhood_id: UUID,
    body: NeighborhoodUpdate,
    _admin: SuperAdminDep,
    session: SessionDep,
) -> NeighborhoodPublic:
    neighborhood = await location_service.update_neighborhood(
        session,
        neighborhood_id,
        body,
    )
    items = await location_service.enrich_neighborhoods(session, [neighborhood])
    return items[0]


@router.delete("/neighborhoods/{neighborhood_id}", status_code=204)
async def admin_delete_neighborhood(
    neighborhood_id: UUID,
    _admin: SuperAdminDep,
    session: SessionDep,
) -> Response:
    await location_service.delete_neighborhood(session, neighborhood_id)
    return Response(status_code=204)
