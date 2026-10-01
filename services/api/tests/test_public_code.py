from app.lib.public_code import (
    CROCKFORD_ALPHABET,
    PUBLIC_CODE_LENGTH,
    generate_public_code,
)


def test_generate_public_code_format() -> None:
    code = generate_public_code()
    assert len(code) == PUBLIC_CODE_LENGTH
    assert all(char in CROCKFORD_ALPHABET for char in code)


def test_generate_public_code_varies() -> None:
    codes = {generate_public_code() for _ in range(40)}
    assert len(codes) > 1
