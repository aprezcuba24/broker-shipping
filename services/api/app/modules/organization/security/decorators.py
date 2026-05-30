from __future__ import annotations

import functools
import inspect
from collections.abc import Awaitable, Callable
from typing import Any, TypeVar
from uuid import UUID

from dishka import FromDishka
from fastapi import HTTPException

from app.lib.security.principal import UserPrincipal
from app.modules.organization.repositories import OrganizationInvitationRepository
from app.modules.organization.services import MembershipService

F = TypeVar("F", bound=Callable[..., Awaitable[Any]])

_MEMBERSHIP_PARAM = "_org_security_membership"
_INVITATION_REPO_PARAM = "_org_security_invitation_repo"
_PRINCIPAL_INTERNAL = "_principal_internal"


def _principal_from_kwargs(kwargs: dict[str, Any]) -> UserPrincipal:
    """``require_user`` exposes ``principal`` or ``_principal_internal`` depending on the handler."""
    if "principal" in kwargs:
        return kwargs["principal"]
    if _PRINCIPAL_INTERNAL in kwargs:
        return kwargs[_PRINCIPAL_INTERNAL]
    msg = "require_user must be applied below organization security decorators"
    raise RuntimeError(msg)


def _append_keyword_param(
    func: F,
    *,
    name: str,
    annotation: Any,
) -> tuple[F, inspect.Signature]:
    sig = inspect.signature(func)
    if name in sig.parameters:
        return func, sig
    params = list(sig.parameters.values())
    params.append(
        inspect.Parameter(
            name,
            inspect.Parameter.KEYWORD_ONLY,
            default=inspect.Parameter.empty,
            annotation=annotation,
        ),
    )
    new_sig = sig.replace(parameters=params)
    merged_ann = dict(getattr(func, "__annotations__", {}))
    merged_ann[name] = annotation
    func.__annotations__ = merged_ann  # type: ignore[attr-defined]
    func.__signature__ = new_sig  # type: ignore[attr-defined]
    return func, new_sig


def require_invitation_org_provider(func: F) -> F:
    """Require provider access to the organization of ``invitation_id``."""

    func, _ = _append_keyword_param(
        func,
        name=_MEMBERSHIP_PARAM,
        annotation=FromDishka[MembershipService],
    )
    func, _ = _append_keyword_param(
        func,
        name=_INVITATION_REPO_PARAM,
        annotation=FromDishka[OrganizationInvitationRepository],
    )

    @functools.wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        membership = kwargs.pop(_MEMBERSHIP_PARAM)
        invitation_repo = kwargs.pop(_INVITATION_REPO_PARAM)
        principal = _principal_from_kwargs(kwargs)
        invitation_id: UUID = kwargs["invitation_id"]
        invitation = await invitation_repo.get_by_id(invitation_id)
        if invitation is None:
            raise HTTPException(status_code=404, detail="Invitation not found")
        await membership.require_provider(principal.user_id, invitation.organization_id)
        return await func(*args, **kwargs)

    wrapper.__signature__ = func.__signature__  # type: ignore[attr-defined]
    wrapper.__annotations__ = getattr(func, "__annotations__", {})
    return wrapper  # type: ignore[return-value]
