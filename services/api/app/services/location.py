from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from app.lib.persistence import get_entity
from app.models.location.municipality import Municipality
from app.models.location.neighborhood import Neighborhood
from app.models.location.province import Province
from app.schemas.location import NeighborhoodPublic

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
    provinces: dict[UUID, Province] = {}
    if province_ids:
        prov_result = await session.execute(
            select(Province).where(col(Province.id).in_(province_ids))
        )
        provinces = {province.id: province for province in prov_result.scalars().all()}
    return municipalities, provinces


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
