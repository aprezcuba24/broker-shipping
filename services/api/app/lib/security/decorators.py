from __future__ import annotations

import functools
import inspect
from collections.abc import Awaitable, Callable
from typing import Annotated, Any, TypeVar

from fastapi import Depends

from app.lib.security.dependencies import (
    _resolve_api_key,
    _resolve_user_or_api_key,
    make_resolve_user,
)
from app.modules.organization.models import OrgMemberRole

F = TypeVar("F", bound=Callable[..., Awaitable[Any]])


def _wrap_with_dependency(
    resolver: Callable[..., Any],
    func: F,
    *,
    inject_param: str,
) -> F:
    """Attach FastAPI-compatible ``Annotated[..., Depends(resolver)]`` for auth."""
    sig = inspect.signature(func)
    internal = f"_{inject_param}_internal"
    has_inject = inject_param in sig.parameters

    new_params = [
        p.replace(annotation=Annotated[p.annotation, Depends(resolver)])
        if p.name == inject_param
        else p
        for p in sig.parameters.values()
    ]
    if not has_inject:
        new_params.append(
            inspect.Parameter(
                internal,
                inspect.Parameter.KEYWORD_ONLY,
                annotation=Annotated[Any, Depends(resolver)],
            ),
        )

    @functools.wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        kwargs.pop(internal, None)
        return await func(*args, **kwargs)

    new_sig = sig.replace(parameters=new_params)
    wrapper.__signature__ = new_sig  # type: ignore[attr-defined]
    merged_ann = dict(getattr(func, "__annotations__", {}))
    if has_inject:
        p_inject = sig.parameters[inject_param]
        merged_ann[inject_param] = Annotated[p_inject.annotation, Depends(resolver)]
    else:
        merged_ann[internal] = Annotated[Any, Depends(resolver)]
    wrapper.__annotations__ = merged_ann
    return wrapper  # type: ignore[return-value]


def require_user(
    func: F | OrgMemberRole | None = None,
    /,
    *,
    role: OrgMemberRole | None = None,
) -> F | Callable[[F], F]:
    if isinstance(func, OrgMemberRole):
        role = func
        func = None

    def decorator(f: F) -> F:
        return _wrap_with_dependency(
            make_resolve_user(required_role=role),
            f,
            inject_param="user",
        )

    if func is not None:
        return decorator(func)
    return decorator


def require_api_key(func: F) -> F:
    return _wrap_with_dependency(_resolve_api_key, func, inject_param="organization")


def require_user_or_api_key(func: F) -> F:
    return _wrap_with_dependency(
        _resolve_user_or_api_key,
        func,
        inject_param="organization",
    )
