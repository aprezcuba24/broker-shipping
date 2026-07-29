from __future__ import annotations

import inspect
from collections.abc import Awaitable, Callable
from functools import wraps
from typing import Any, TypeVar, get_args, get_origin, get_type_hints

from app.db.context import AppContext, app_context

F = TypeVar("F", bound=Callable[..., Awaitable[Any]])


def _annotation_is_app_context(annotation: Any) -> bool:
    if annotation is AppContext:
        return True
    origin = get_origin(annotation)
    if origin is None:
        return False
    return any(arg is AppContext for arg in get_args(annotation))


def _find_app_context_param(fn: Callable[..., Any]) -> str | None:
    try:
        hints = get_type_hints(fn)
    except Exception:
        hints = {}
    signature = inspect.signature(fn)
    for name, param in signature.parameters.items():
        annotation = hints.get(name, param.annotation)
        if annotation is inspect.Parameter.empty:
            continue
        if _annotation_is_app_context(annotation):
            return name
    return None


def inject_app_context(fn: F) -> F:
    """Inject ``AppContext`` when the callable declares a matching parameter.

    Handlers without an ``AppContext`` parameter are returned unchanged.
    """
    param_name = _find_app_context_param(fn)
    if param_name is None:
        return fn

    @wraps(fn)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        if param_name in kwargs:
            return await fn(*args, **kwargs)
        async with app_context() as ctx:
            kwargs[param_name] = ctx
            return await fn(*args, **kwargs)

    return wrapper  # type: ignore[return-value]
