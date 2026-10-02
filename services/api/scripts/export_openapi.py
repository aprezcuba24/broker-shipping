"""Export OpenAPI schema to packages/api/openapi.json (no server or DB required)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

_API_ROOT = Path(__file__).resolve().parents[1]
if str(_API_ROOT) not in sys.path:
    sys.path.insert(0, str(_API_ROOT))

_OUTPUT = _API_ROOT.parent.parent / "packages" / "api" / "openapi.json"


def main() -> None:
    from app.main import app
    from app.models.product.enums import ShareChannel

    schema = app.openapi()
    # Expose ShareChannel to the TS client before metrics endpoints exist.
    schema.setdefault("components", {}).setdefault("schemas", {})["ShareChannel"] = {
        "type": "string",
        "enum": [member.value for member in ShareChannel],
        "title": "ShareChannel",
        "description": (
            "Social channel prefix for product WhatsApp share codes "
            "and attribution metrics."
        ),
    }
    _OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    _OUTPUT.write_text(json.dumps(schema, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {_OUTPUT}")


if __name__ == "__main__":
    main()
