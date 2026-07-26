"""Opaque email verification tokens (hashed at rest)."""

from __future__ import annotations

import secrets

from app.lib.security.api_keys import hash_secret

TOKEN_BYTES = 32


def generate_verification_token() -> tuple[str, str]:
    """Return ``(raw_token, token_hash)``."""
    raw = secrets.token_urlsafe(TOKEN_BYTES)
    return raw, hash_secret(raw)


def verify_token(raw: str, stored_hash: str | None) -> bool:
    if not raw or not stored_hash:
        return False
    return secrets.compare_digest(hash_secret(raw), stored_hash)
