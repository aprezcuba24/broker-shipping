from __future__ import annotations

from app.lib.security.api_keys import (
    PREFIX_LENGTH,
    generate_api_key,
    hash_secret,
    split_raw,
)


def test_generate_api_key_format() -> None:
    raw, prefix, secret_hash = generate_api_key()
    assert raw.startswith("bk_")
    assert len(prefix) == PREFIX_LENGTH
    assert len(secret_hash) == 64
    parts = split_raw(raw)
    assert parts is not None
    parsed_prefix, secret = parts
    assert parsed_prefix == prefix
    assert hash_secret(secret) == secret_hash


def test_split_raw_valid() -> None:
    prefix = "a" * PREFIX_LENGTH
    secret = "b" * 32
    assert split_raw(f"bk_{prefix}_{secret}") == (prefix, secret)


def test_split_raw_rejects_invalid() -> None:
    assert split_raw(None) is None
    assert split_raw("") is None
    assert split_raw("not-a-key") is None
    assert split_raw("bk_") is None
    assert split_raw("bk_short_secret") is None
    assert split_raw(f"bk_{'x' * PREFIX_LENGTH}_") is None
    assert split_raw(f"bk_{'x' * (PREFIX_LENGTH - 1)}_secret") is None


def test_hash_secret_stable() -> None:
    assert hash_secret("abc") == hash_secret("abc")
    assert hash_secret("abc") != hash_secret("abd")
