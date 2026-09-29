from __future__ import annotations

from uuid import UUID

from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from app.lib.exceptions import raise_api_error
from app.lib.persistence import apply_partial_update, get_entity
from app.lib.persistence.pagination import paginate
from app.models.customer.address import Address
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
    ProvinceUpdate,
)
from app.schemas.pagination import PageResult, PaginationParams

_SEARCH_LIMIT = 20


def _name_term(name: str | None) -> str | None:
    if name is None:
        return None
    term = name.strip()
    return term or None


async def list_provinces(
    session: AsyncSession,
    *,
    name: str | None = None,
) -> list[Province]:
    stmt = select(Province).order_by(Province.name)
    term = _name_term(name)
    if term is not None:
        stmt = stmt.where(col(Province.name).ilike(f"%{term}%")).limit(_SEARCH_LIMIT)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def list_municipalities_for_province(
    session: AsyncSession,
    province_id: UUID,
    *,
    name: str | None = None,
) -> list[Municipality]:
    await get_entity(session, Province, id=province_id)
    stmt = (
        select(Municipality)
        .where(Municipality.province_id == province_id)
        .order_by(Municipality.name)
    )
    term = _name_term(name)
    if term is not None:
        stmt = stmt.where(col(Municipality.name).ilike(f"%{term}%")).limit(_SEARCH_LIMIT)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def list_neighborhoods_for_municipality(
    session: AsyncSession,
    municipality_id: UUID,
    *,
    name: str | None = None,
) -> list[Neighborhood]:
    await get_entity(session, Municipality, id=municipality_id)
    stmt = (
        select(Neighborhood)
        .where(Neighborhood.municipality_id == municipality_id)
        .order_by(Neighborhood.name)
    )
    term = _name_term(name)
    if term is not None:
        stmt = stmt.where(col(Neighborhood.name).ilike(f"%{term}%")).limit(_SEARCH_LIMIT)
    result = await session.execute(stmt)
    return list(result.scalars().all())


def to_municipality_public(
    municipality: Municipality,
    *,
    province: Province | None = None,
) -> MunicipalityPublic:
    return MunicipalityPublic(
        id=municipality.id,
        name=municipality.name,
        province_id=municipality.province_id,
        province_name=province.name if province is not None else None,
        created_at=municipality.created_at,
        updated_at=municipality.updated_at,
    )


def to_neighborhood_public(
    neighborhood: Neighborhood,
    *,
    municipality: Municipality | None = None,
    province: Province | None = None,
) -> NeighborhoodPublic:
    municipality_name = municipality.name if municipality is not None else None
    province_id = municipality.province_id if municipality is not None else None
    province_name = province.name if province is not None else None
    return NeighborhoodPublic(
        id=neighborhood.id,
        name=neighborhood.name,
        municipality_id=neighborhood.municipality_id,
        municipality_name=municipality_name,
        province_id=province_id,
        province_name=province_name,
        created_at=neighborhood.created_at,
        updated_at=neighborhood.updated_at,
    )


async def _provinces_by_id(
    session: AsyncSession,
    province_ids: list[UUID],
) -> dict[UUID, Province]:
    if not province_ids:
        return {}
    result = await session.execute(
        select(Province).where(col(Province.id).in_(province_ids))
    )
    return {province.id: province for province in result.scalars().all()}


async def _municipalities_and_provinces_by_id(
    session: AsyncSession,
    municipality_ids: list[UUID],
) -> tuple[dict[UUID, Municipality], dict[UUID, Province]]:
    if not municipality_ids:
        return {}, {}
    mun_result = await session.execute(
        select(Municipality).where(col(Municipality.id).in_(municipality_ids))
    )
    municipalities = {
        municipality.id: municipality for municipality in mun_result.scalars().all()
    }
    province_ids = list({m.province_id for m in municipalities.values()})
    provinces = await _provinces_by_id(session, province_ids)
    return municipalities, provinces


async def enrich_municipalities(
    session: AsyncSession,
    municipalities: list[Municipality],
) -> list[MunicipalityPublic]:
    province_ids = list({m.province_id for m in municipalities})
    provinces = await _provinces_by_id(session, province_ids)
    return [
        to_municipality_public(
            municipality,
            province=provinces.get(municipality.province_id),
        )
        for municipality in municipalities
    ]


async def enrich_neighborhoods(
    session: AsyncSession,
    neighborhoods: list[Neighborhood],
) -> list[NeighborhoodPublic]:
    municipality_ids = list({n.municipality_id for n in neighborhoods})
    municipalities, provinces = await _municipalities_and_provinces_by_id(
        session,
        municipality_ids,
    )
    items: list[NeighborhoodPublic] = []
    for neighborhood in neighborhoods:
        municipality = municipalities.get(neighborhood.municipality_id)
        province = (
            provinces.get(municipality.province_id) if municipality is not None else None
        )
        items.append(
            to_neighborhood_public(
                neighborhood,
                municipality=municipality,
                province=province,
            )
        )
    return items


async def _count_where(session: AsyncSession, stmt) -> int:
    result = await session.execute(stmt)
    return int(result.scalar_one())


async def _ensure_province_name_available(
    session: AsyncSession,
    name: str,
    *,
    exclude_id: UUID | None = None,
) -> None:
    stmt = select(func.count()).select_from(Province).where(
        func.lower(Province.name) == name.lower()
    )
    if exclude_id is not None:
        stmt = stmt.where(Province.id != exclude_id)
    if await _count_where(session, stmt) > 0:
        raise_api_error("province_name_conflict")


async def _ensure_municipality_name_available(
    session: AsyncSession,
    *,
    province_id: UUID,
    name: str,
    exclude_id: UUID | None = None,
) -> None:
    stmt = (
        select(func.count())
        .select_from(Municipality)
        .where(
            Municipality.province_id == province_id,
            func.lower(Municipality.name) == name.lower(),
        )
    )
    if exclude_id is not None:
        stmt = stmt.where(Municipality.id != exclude_id)
    if await _count_where(session, stmt) > 0:
        raise_api_error("municipality_name_conflict")


async def _ensure_neighborhood_name_available(
    session: AsyncSession,
    *,
    municipality_id: UUID,
    name: str,
    exclude_id: UUID | None = None,
) -> None:
    stmt = (
        select(func.count())
        .select_from(Neighborhood)
        .where(
            Neighborhood.municipality_id == municipality_id,
            func.lower(Neighborhood.name) == name.lower(),
        )
    )
    if exclude_id is not None:
        stmt = stmt.where(Neighborhood.id != exclude_id)
    if await _count_where(session, stmt) > 0:
        raise_api_error("neighborhood_name_conflict")


# --- Admin list ---


async def admin_list_provinces(
    session: AsyncSession,
    *,
    pagination: PaginationParams,
    name: str | None = None,
) -> PageResult[Province]:
    stmt = select(Province).order_by(Province.name)
    term = _name_term(name)
    if term is not None:
        stmt = stmt.where(col(Province.name).ilike(f"%{term}%"))
    return await paginate(session, stmt, pagination)


async def admin_list_municipalities(
    session: AsyncSession,
    *,
    pagination: PaginationParams,
    name: str | None = None,
    province_id: UUID | None = None,
) -> PageResult[Municipality]:
    stmt = select(Municipality).order_by(Municipality.name)
    term = _name_term(name)
    if term is not None:
        stmt = stmt.where(col(Municipality.name).ilike(f"%{term}%"))
    if province_id is not None:
        await get_entity(session, Province, id=province_id)
        stmt = stmt.where(Municipality.province_id == province_id)
    return await paginate(session, stmt, pagination)


async def admin_list_neighborhoods(
    session: AsyncSession,
    *,
    pagination: PaginationParams,
    name: str | None = None,
    municipality_id: UUID | None = None,
    province_id: UUID | None = None,
) -> PageResult[Neighborhood]:
    stmt = select(Neighborhood).order_by(Neighborhood.name)
    term = _name_term(name)
    if term is not None:
        stmt = stmt.where(col(Neighborhood.name).ilike(f"%{term}%"))
    if municipality_id is not None:
        await get_entity(session, Municipality, id=municipality_id)
        stmt = stmt.where(Neighborhood.municipality_id == municipality_id)
    elif province_id is not None:
        await get_entity(session, Province, id=province_id)
        stmt = stmt.join(
            Municipality,
            Municipality.id == Neighborhood.municipality_id,
        ).where(Municipality.province_id == province_id)
    return await paginate(session, stmt, pagination)


# --- Admin province CRUD ---


async def create_province(
    session: AsyncSession,
    data: ProvinceCreate,
) -> Province:
    await _ensure_province_name_available(session, data.name)
    province = Province(name=data.name)
    session.add(province)
    await session.commit()
    await session.refresh(province)
    return province


async def update_province(
    session: AsyncSession,
    province_id: UUID,
    data: ProvinceUpdate,
) -> Province:
    province = await get_entity(session, Province, id=province_id)
    if data.name is not None:
        await _ensure_province_name_available(
            session,
            data.name,
            exclude_id=province_id,
        )
    apply_partial_update(province, data)
    session.add(province)
    await session.commit()
    await session.refresh(province)
    return province


async def delete_province(
    session: AsyncSession,
    province_id: UUID,
) -> None:
    province = await get_entity(session, Province, id=province_id)
    mun_count = await _count_where(
        session,
        select(func.count())
        .select_from(Municipality)
        .where(Municipality.province_id == province_id),
    )
    if mun_count > 0:
        raise_api_error("province_has_municipalities")
    addr_count = await _count_where(
        session,
        select(func.count()).select_from(Address).where(Address.province_id == province_id),
    )
    if addr_count > 0:
        raise_api_error("province_in_use")
    await session.delete(province)
    await session.commit()


# --- Admin municipality CRUD ---


async def create_municipality(
    session: AsyncSession,
    data: MunicipalityCreate,
) -> Municipality:
    await get_entity(session, Province, id=data.province_id)
    await _ensure_municipality_name_available(
        session,
        province_id=data.province_id,
        name=data.name,
    )
    municipality = Municipality(name=data.name, province_id=data.province_id)
    session.add(municipality)
    await session.commit()
    await session.refresh(municipality)
    return municipality


async def update_municipality(
    session: AsyncSession,
    municipality_id: UUID,
    data: MunicipalityUpdate,
) -> Municipality:
    municipality = await get_entity(session, Municipality, id=municipality_id)
    province_id = data.province_id if data.province_id is not None else municipality.province_id
    if data.province_id is not None:
        await get_entity(session, Province, id=data.province_id)
    name = data.name if data.name is not None else municipality.name
    if data.name is not None or data.province_id is not None:
        await _ensure_municipality_name_available(
            session,
            province_id=province_id,
            name=name,
            exclude_id=municipality_id,
        )
    apply_partial_update(municipality, data)
    session.add(municipality)
    await session.commit()
    await session.refresh(municipality)
    return municipality


async def delete_municipality(
    session: AsyncSession,
    municipality_id: UUID,
) -> None:
    municipality = await get_entity(session, Municipality, id=municipality_id)
    neigh_count = await _count_where(
        session,
        select(func.count())
        .select_from(Neighborhood)
        .where(Neighborhood.municipality_id == municipality_id),
    )
    if neigh_count > 0:
        raise_api_error("municipality_has_neighborhoods")
    addr_count = await _count_where(
        session,
        select(func.count())
        .select_from(Address)
        .where(Address.municipality_id == municipality_id),
    )
    if addr_count > 0:
        raise_api_error("municipality_in_use")
    await session.delete(municipality)
    await session.commit()


# --- Admin neighborhood CRUD ---


async def create_neighborhood(
    session: AsyncSession,
    data: NeighborhoodCreate,
) -> Neighborhood:
    await get_entity(session, Municipality, id=data.municipality_id)
    await _ensure_neighborhood_name_available(
        session,
        municipality_id=data.municipality_id,
        name=data.name,
    )
    neighborhood = Neighborhood(
        name=data.name,
        municipality_id=data.municipality_id,
    )
    session.add(neighborhood)
    await session.commit()
    await session.refresh(neighborhood)
    return neighborhood


async def update_neighborhood(
    session: AsyncSession,
    neighborhood_id: UUID,
    data: NeighborhoodUpdate,
) -> Neighborhood:
    neighborhood = await get_entity(session, Neighborhood, id=neighborhood_id)
    municipality_id = (
        data.municipality_id
        if data.municipality_id is not None
        else neighborhood.municipality_id
    )
    if data.municipality_id is not None:
        await get_entity(session, Municipality, id=data.municipality_id)
    name = data.name if data.name is not None else neighborhood.name
    if data.name is not None or data.municipality_id is not None:
        await _ensure_neighborhood_name_available(
            session,
            municipality_id=municipality_id,
            name=name,
            exclude_id=neighborhood_id,
        )
    apply_partial_update(neighborhood, data)
    session.add(neighborhood)
    await session.commit()
    await session.refresh(neighborhood)
    return neighborhood


async def delete_neighborhood(
    session: AsyncSession,
    neighborhood_id: UUID,
) -> None:
    neighborhood = await get_entity(session, Neighborhood, id=neighborhood_id)
    addr_count = await _count_where(
        session,
        select(func.count())
        .select_from(Address)
        .where(Address.neighborhood_id == neighborhood_id),
    )
    if addr_count > 0:
        raise_api_error("neighborhood_in_use")
    await session.delete(neighborhood)
    await session.commit()
