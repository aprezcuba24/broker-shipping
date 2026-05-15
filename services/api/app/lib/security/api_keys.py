from __future__ import annotations

import hashlib
import secrets


PREFIX_LENGTH = 12
SECRET_BYTES = 16  # 32 hex chars


def hash_secret(secret: str) -> str:
    return hashlib.sha256(secret.encode()).hexdigest()


def generate_api_key() -> tuple[str, str, str]:
    """Return ``(raw_full_key, prefix, secret_hash)``.

    Raw format: ``bk_<prefix>_<secret_hex>`` where ``secret_hex`` is ``SECRET_BYTES``
    random bytes as hex (length ``SECRET_BYTES * 2``).
    """
    prefix = secrets.token_hex(PREFIX_LENGTH // 2)[:PREFIX_LENGTH]
    secret_part = secrets.token_hex(SECRET_BYTES)
    raw = f"bk_{prefix}_{secret_part}"
    return raw, prefix, hash_secret(secret_part)


def split_raw(raw: str | None) -> tuple[str, str] | None:
    """Split ``bk_<prefix>_<secret>`` into ``(prefix, secret)`` or ``None``."""
    if not raw or not raw.startswith("bk_"):
        return None
    rest = raw.removeprefix("bk_")
    parts = rest.split("_", 1)
    if len(parts) != 2:
        return None
    prefix, secret = parts
    if len(prefix) != PREFIX_LENGTH or not secret:
        return None
    return prefix, secret
