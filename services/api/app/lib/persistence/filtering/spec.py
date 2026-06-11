from __future__ import annotations

from collections.abc import Callable, Mapping, Sequence
from enum import StrEnum
from typing import Any, Generic, TypeVar, get_args, get_origin

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, ConfigDict, create_model
from sqlalchemy import Select, or_
from sqlmodel import SQLModel

M = TypeVar("M", bound=SQLModel)


class FilterOperator(StrEnum):
    eq = "eq"
    ilike = "ilike"
    or_ilike = "or_ilike"


class FilterFieldConfig:
    def __init__(
        self,
        *,
        operator: FilterOperator,
        column: str | None = None,
        columns: Sequence[str] | None = None,
    ) -> None:
        self.operator = operator
        self.column = column
        self.columns = tuple(columns) if columns is not None else None


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
        for param_name, config in self._fields.items():
            if config.operator is FilterOperator.or_ilike:
                if not config.columns:
                    msg = f"or_ilike filter {param_name!r} requires columns"
                    raise ValueError(msg)
                for column_name in config.columns:
                    if column_name not in model.model_fields:
                        msg = (
                            f"Filter column {column_name!r} is not on {model.__name__}"
                        )
                        raise ValueError(msg)
            else:
                column_name = config.column or param_name
                if column_name not in model.model_fields:
                    msg = f"Filter column {column_name!r} is not on {model.__name__}"
                    raise ValueError(msg)

    def _column_name(self, param_name: str) -> str:
        return self._fields[param_name].column or param_name

    def as_params_model(self, *, model_name: str | None = None) -> type[BaseModel]:
        field_definitions: dict[str, tuple[Any, None]] = {}
        for param_name, config in self._fields.items():
            if config.operator is FilterOperator.or_ilike:
                field_definitions[param_name] = (str | None, None)
            else:
                column_name = self._column_name(param_name)
                model_field = self._model.model_fields[column_name]
                field_definitions[param_name] = (
                    _optional_annotation(model_field.annotation),
                    None,
                )
        name = model_name or f"{self._model.__name__}ListFilters"
        return create_model(
            name,
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
            data = {
                key: request.query_params[key]
                for key in request.query_params
                if key in allowed
            }
            return filters_model.model_validate(data)

        return parse_filters

    def apply(self, stmt: Select[Any], filters: BaseModel) -> Select[Any]:
        for name, config in self._fields.items():
            value = getattr(filters, name, None)
            if value is None:
                continue
            if isinstance(value, str) and not value:
                continue
            if config.operator is FilterOperator.or_ilike:
                pattern = f"%{_escape_ilike(value)}%"
                conditions = [
                    getattr(self._model, col).ilike(pattern, escape="\\")
                    for col in config.columns or ()
                ]
                stmt = stmt.where(or_(*conditions))
                continue
            column_name = self._column_name(name)
            column = getattr(self._model, column_name)
            if config.operator is FilterOperator.eq:
                stmt = stmt.where(column == value)
            elif config.operator is FilterOperator.ilike:
                pattern = f"%{_escape_ilike(value)}%"
                stmt = stmt.where(column.ilike(pattern, escape="\\"))
            else:
                msg = f"Unsupported filter operator: {config.operator}"
                raise ValueError(msg)
        return stmt
