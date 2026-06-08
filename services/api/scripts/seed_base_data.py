"""Entrypoint: wipe domain tables and seed base development data."""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

_API_ROOT = Path(__file__).resolve().parents[1]
if str(_API_ROOT) not in sys.path:
    sys.path.insert(0, str(_API_ROOT))

from seeds.registry import run_seed  # noqa: E402


def main() -> None:
    asyncio.run(run_seed())


if __name__ == "__main__":
    main()
