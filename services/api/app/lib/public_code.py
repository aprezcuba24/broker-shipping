"""Short Crockford base32 codes for public product identifiers."""

from __future__ import annotations

import secrets

# Crockford base32: excludes I, L, O, U to avoid ambiguous characters.
CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
PUBLIC_CODE_LENGTH = 4


def generate_public_code(*, length: int = PUBLIC_CODE_LENGTH) -> str:
    if length < 1:
        raise ValueError("length must be >= 1")
    return "".join(secrets.choice(CROCKFORD_ALPHABET) for _ in range(length))
