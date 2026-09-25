from __future__ import annotations

from typing import Any, NoReturn
from uuid import UUID

from app.lib.exceptions.catalog import ERRORS


def serialize_param(value: Any) -> Any:
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, dict):
        return {str(k): serialize_param(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [serialize_param(item) for item in value]
    return value


def serialize_params(params: dict[str, Any]) -> dict[str, Any]:
    return {key: serialize_param(value) for key, value in params.items()}


class ApiError(Exception):
    """Domain/API error with stable code, Spanish message, and params."""

    def __init__(
        self,
        code: str,
        params: dict[str, Any] | None = None,
        *,
        message: str | None = None,
    ) -> None:
        try:
            error_def = ERRORS[code]
        except KeyError as exc:
            raise KeyError(f"Unknown API error code: {code!r}") from exc

        self.code = error_def.code
        self.status_code = error_def.status_code
        self.params = serialize_params(params or {})
        if message is not None:
            self.message = message
        else:
            self.message = error_def.template.format(**self.params)
        super().__init__(self.message)

    def to_body(self) -> dict[str, Any]:
        return {
            "code": self.code,
            "message": self.message,
            "params": self.params,
        }


def raise_api_error(code: str, **params: Any) -> NoReturn:
    raise ApiError(code, params)
