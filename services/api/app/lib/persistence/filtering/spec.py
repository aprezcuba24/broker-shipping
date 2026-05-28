from __future__ import annotations

from collections.abc import Callable, Mapping
from enum import StrEnum
from typing import Any, Generic, TypeVar, get_args, get_origin

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, ConfigDict, create_model
from sqlalchemy import Select
from sqlmodel import SQLModel

M = TypeVar("M", bound=SQLModel)


class FilterOperator(StrEnum):
    eq = "eq"
    ilike = "ilike"


class FilterFieldConfig:
    def __init__(self, *, operator: FilterOperator) -> None:
        self.operator = operator


def _escape_ilike(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _optional_annotation(annotation: Any) -> Any:
    if get_origin(annotation) is not None:
        return annotation | None
    return annotation | None


class FilterSpec(Generic[M]):
    """Declarative filter config for a SQLModel entity."""

    def __init__(
        self,
        *,
        model: type[M],
        fields: Mapping[str, FilterFieldConfig],
    ) -> None:
        self._model = model
        self._fields = dict(fields)
        for name in self._fields:
            if name not in model.model_fields:
                msg = f"Filter field {name!r} is not on {model.__name__}"
                raise ValueError(msg)

    def as_params_model(self) -> type[BaseModel]:
        field_definitions: dict[str, tuple[Any, None]] = {}
        for name in self._fields:
            model_field = self._model.model_fields[name]
            field_definitions[name] = (_optional_annotation(model_field.annotation), None)
        return create_model(
            f"{self._model.__name__}ListFilters",
            __config__=ConfigDict(extra="forbid"),
            **field_definitions,
        )

    def as_dependency(self) -> Callable[..., Any]:
        """FastAPI dependency that rejects unknown query params (plain Depends() does not)."""
        filters_model = self.as_params_model()
        allowed = frozenset(self._fields)

        async def parse_filters(request: Request) -> BaseModel:
            unknown = set(request.query_params.keys()) - allowed
            if unknown:
                raise RequestValidationError(
                    [
                        {
                            "type": "extra_forbidden",
                            "loc": ("query", key),
                            "msg": "Extra inputs are not permitted",
                            "input": request.query_params.get(key),
                        }
                        for key in sorted(unknown)
                    ],
                )
            data = {key: request.query_params[key] for key in request.query_params if key in allowed}
            return filters_model.model_validate(data)

        return parse_filters

    def apply(self, stmt: Select[Any], filters: BaseModel) -> Select[Any]:
        for name, config in self._fields.items():
            value = getattr(filters, name, None)
            if value is None:
                continue
            if isinstance(value, str) and not value:
                continue
            column = getattr(self._model, name)
            if config.operator is FilterOperator.eq:
                stmt = stmt.where(column == value)
            elif config.operator is FilterOperator.ilike:
                pattern = f"%{_escape_ilike(value)}%"
                stmt = stmt.where(column.ilike(pattern, escape="\\"))
            else:
                msg = f"Unsupported filter operator: {config.operator}"
                raise ValueError(msg)
        return stmt
