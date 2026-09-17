"""Create La Habana province with all official municipalities (idempotent).

Official source: Ley No. 110 (Gaceta Oficial No. 023/2010) and ONEI CODPA.

Usage:
  cd services/api
  uv run python scripts/create_habana.py
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

# Allow `uv run python scripts/create_habana.py` from services/api
_ROOT = Path(__file__).resolve().parents[1]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from sqlmodel import select

from app.config import settings
from app.db.session import create_async_engine_and_session_maker
from app.models.location.municipality import Municipality
from app.models.location.province import Province

PROVINCE_NAME = "La Habana"

# Orden oficial ONEI CODPA (códigos 23.01–23.15)
HABANA_MUNICIPALITIES: tuple[str, ...] = (
    "Playa",
    "Plaza de la Revolución",
    "Centro Habana",
    "La Habana Vieja",
    "Regla",
    "La Habana del Este",
    "Guanabacoa",
    "San Miguel del Padrón",
    "Diez de Octubre",
    "Cerro",
    "Marianao",
    "La Lisa",
    "Boyeros",
    "Arroyo Naranjo",
    "Cotorro",
)


async def create_habana() -> None:
    engine, session_maker = create_async_engine_and_session_maker(settings.database_url)
    try:
        async with session_maker() as session:
            result = await session.execute(
                select(Province).where(Province.name == PROVINCE_NAME)
            )
            province = result.scalar_one_or_none()
            province_created = False
            if province is None:
                province = Province(name=PROVINCE_NAME)
                session.add(province)
                await session.flush()
                province_created = True

            mun_result = await session.execute(
                select(Municipality).where(Municipality.province_id == province.id)
            )
            existing_muns = {m.name for m in mun_result.scalars().all()}

            created_municipalities: list[str] = []
            skipped_municipalities: list[str] = []
            for mun_name in HABANA_MUNICIPALITIES:
                if mun_name in existing_muns:
                    skipped_municipalities.append(mun_name)
                    continue
                session.add(
                    Municipality(name=mun_name, province_id=province.id),
                )
                created_municipalities.append(mun_name)

            await session.commit()
            await session.refresh(province)

            province_status = "created" if province_created else "already existed"
            print(
                f"Province {PROVINCE_NAME!r} ({province_status}, id={province.id})"
            )
            print(
                f"Municipalities: created={len(created_municipalities)} "
                f"already_existed={len(skipped_municipalities)} "
                f"total={len(HABANA_MUNICIPALITIES)}"
            )
            if created_municipalities:
                print("  Created:")
                for name in created_municipalities:
                    print(f"    - {name}")
            if skipped_municipalities:
                print("  Already existed:")
                for name in skipped_municipalities:
                    print(f"    - {name}")
    finally:
        await engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Create La Habana province with its 15 official municipalities "
            "(idempotent by name)."
        ),
    )
    parser.parse_args()
    asyncio.run(create_habana())


if __name__ == "__main__":
    main()
