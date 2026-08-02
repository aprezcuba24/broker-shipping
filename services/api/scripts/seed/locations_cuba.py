"""Seed Cuban provinces and municipalities (idempotent by name)."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.location.municipality import Municipality
from app.models.location.province import Province

NAME = "locations_cuba"

# Subset sufficient for demos; expand as needed.
CUBA_LOCATIONS: dict[str, list[str]] = {
    "Pinar del Río": [
        "Pinar del Río",
        "Consolación del Sur",
        "San Juan y Martínez",
        "San Luis",
        "Viñales",
    ],
    "Artemisa": [
        "Artemisa",
        "Bauta",
        "Caimito",
        "Guanajay",
        "Güira de Melena",
        "San Antonio de los Baños",
    ],
    "La Habana": [
        "Plaza de la Revolución",
        "Centro Habana",
        "Habana Vieja",
        "Cerro",
        "Diez de Octubre",
        "Playa",
        "Marianao",
        "La Lisa",
        "Boyeros",
        "Arroyo Naranjo",
        "San Miguel del Padrón",
        "Guanabacoa",
        "Regla",
        "Habana del Este",
        "Cotorro",
    ],
    "Mayabeque": [
        "San José de las Lajas",
        "Bejucal",
        "Güines",
        "Melena del Sur",
        "Santa Cruz del Norte",
    ],
    "Matanzas": [
        "Matanzas",
        "Cárdenas",
        "Colón",
        "Jagüey Grande",
        "Varadero",
    ],
    "Cienfuegos": [
        "Cienfuegos",
        "Abreus",
        "Cruces",
        "Palmira",
        "Rodas",
    ],
    "Villa Clara": [
        "Santa Clara",
        "Caibarién",
        "Camajuaní",
        "Manicaragua",
        "Remedios",
        "Sagua la Grande",
    ],
    "Sancti Spíritus": [
        "Sancti Spíritus",
        "Cabaiguán",
        "Fomento",
        "Jatibonico",
        "Trinidad",
        "Yaguajay",
    ],
    "Ciego de Ávila": [
        "Ciego de Ávila",
        "Morón",
        "Venezuela",
        "Baraguá",
        "Chambas",
    ],
    "Camagüey": [
        "Camagüey",
        "Florida",
        "Guáimaro",
        "Nuevitas",
        "Santa Cruz del Sur",
    ],
    "Las Tunas": [
        "Las Tunas",
        "Jobabo",
        "Manatí",
        "Puerto Padre",
        "Amancio",
    ],
    "Holguín": [
        "Holguín",
        "Banes",
        "Gibara",
        "Moa",
        "Mayarí",
    ],
    "Granma": [
        "Bayamo",
        "Manzanillo",
        "Niquero",
        "Yara",
        "Bartolomé Masó",
    ],
    "Santiago de Cuba": [
        "Santiago de Cuba",
        "Contramaestre",
        "Palma Soriano",
        "San Luis",
        "Songo-La Maya",
    ],
    "Guantánamo": [
        "Guantánamo",
        "Baracoa",
        "Imías",
        "Maisí",
        "San Antonio del Sur",
    ],
    "Isla de la Juventud": [
        "Nueva Gerona",
    ],
}


async def run(session: AsyncSession) -> None:
    result = await session.execute(select(Province))
    existing_provinces = {p.name: p for p in result.scalars().all()}

    created_provinces = 0
    created_municipalities = 0

    for province_name, municipalities in CUBA_LOCATIONS.items():
        province = existing_provinces.get(province_name)
        if province is None:
            province = Province(name=province_name)
            session.add(province)
            await session.flush()
            existing_provinces[province_name] = province
            created_provinces += 1

        mun_result = await session.execute(
            select(Municipality).where(Municipality.province_id == province.id)
        )
        existing_muns = {m.name for m in mun_result.scalars().all()}

        for mun_name in municipalities:
            if mun_name in existing_muns:
                continue
            session.add(
                Municipality(name=mun_name, province_id=province.id),
            )
            created_municipalities += 1

    await session.flush()
    print(
        f"  [{NAME}] provinces_created={created_provinces} "
        f"municipalities_created={created_municipalities}"
    )
