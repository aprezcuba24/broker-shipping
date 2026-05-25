"""Export OpenAPI schema to packages/api/openapi.json (no server or DB required)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

# services/api on sys.path when invoked via `uv run python scripts/export_openapi.py`
_API_ROOT = Path(__file__).resolve().parents[1]
if str(_API_ROOT) not in sys.path:
    sys.path.insert(0, str(_API_ROOT))

from app.main import app  # noqa: E402
from app.modules import get_app_modules  # noqa: E402

_OUTPUT = _API_ROOT.parent.parent / "packages" / "api" / "openapi.json"


def _register_routes_only() -> None:
    """Mount domain routers without event listeners (OpenAPI does not need them)."""
    for module in get_app_modules():
        tag = module.prefix.strip("/").replace("-", "_") or "module"
        app.include_router(module.get_router(), prefix=module.prefix, tags=[tag])


def main() -> None:
    _register_routes_only()
    schema = app.openapi()
    _OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    _OUTPUT.write_text(
        json.dumps(schema, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {_OUTPUT}")


if __name__ == "__main__":
    main()
