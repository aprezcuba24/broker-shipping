from __future__ import annotations

import functools
import inspect
from collections.abc import Awaitable, Callable
from typing import Annotated, Any, TypeVar

from fastapi import Depends

from app.lib.security.dependencies import (
    _resolve_api_key,
    _resolve_user,
    _resolve_user_or_api_key,
)

F = TypeVar("F", bound=Callable[..., Awaitable[Any]])


def _wrap_with_dependency(resolver: Callable[..., Any], func: F) -> F:
    """Attach FastAPI-compatible ``Annotated[..., Depends(resolver)]`` for auth."""
    sig = inspect.signature(func)
    params: list[inspect.Parameter] = []
    has_principal = False
    for p in sig.parameters.values():
        if p.name == "principal":
            has_principal = True
            ann = Annotated[p.annotation, Depends(resolver)]
            params.append(
                inspect.Parameter(
                    "principal",
                    p.kind,
                    default=inspect.Parameter.empty,
                    annotation=ann,
                ),
            )
        else:
            params.append(p)
    if not has_principal:
        params.append(
            inspect.Parameter(
                "_principal_internal",
                inspect.Parameter.KEYWORD_ONLY,
                default=inspect.Parameter.empty,
                annotation=Annotated[Any, Depends(resolver)],
            ),
        )

    new_sig = sig.replace(parameters=params)

    if inspect.iscoroutinefunction(func):

        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            kwargs.pop("_principal_internal", None)
            return await func(*args, **kwargs)
    else:

        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:  # pragma: no cover - routes are async
            kwargs.pop("_principal_internal", None)
            return func(*args, **kwargs)

    wrapper.__signature__ = new_sig  # type: ignore[attr-defined]
    # `wraps` copies plain `principal` annotations; Dishka inject reads `__annotations__`
    # for FastAPI — without Depends here, multiple body fields are inferred.
    merged_ann = dict(getattr(func, "__annotations__", {}))
    if has_principal:
        p_princ = sig.parameters["principal"]
        merged_ann["principal"] = Annotated[p_princ.annotation, Depends(resolver)]
    else:
        merged_ann["_principal_internal"] = Annotated[Any, Depends(resolver)]
    wrapper.__annotations__ = merged_ann
    return wrapper  # type: ignore[return-value]


def require_user(func: F) -> F:
    return _wrap_with_dependency(_resolve_user, func)


def require_api_key(func: F) -> F:
    return _wrap_with_dependency(_resolve_api_key, func)


def require_user_or_api_key(func: F) -> F:
    return _wrap_with_dependency(_resolve_user_or_api_key, func)
