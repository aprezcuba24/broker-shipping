def optional_stripped_str(value: object | None) -> str | None:
    if value is None or not str(value).strip():
        return None
    return str(value).strip()


def get_header_value(headers: object, *names: str) -> str | None:
    for name in names:
        raw = headers.get(name)  # type: ignore[union-attr]
        result = optional_stripped_str(raw)
        if result is not None:
            return result
    return None
