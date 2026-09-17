from __future__ import annotations

from contextvars import ContextVar

from sqlalchemy.ext.asyncio import AsyncSession

_emit_session: ContextVar[AsyncSession | None] = ContextVar(
    "emit_session",
    default=None,
)
_emit_propagate_errors: ContextVar[bool] = ContextVar(
    "emit_propagate_errors",
    default=False,
)


def get_emit_session() -> AsyncSession | None:
    return _emit_session.get()


def get_emit_propagate_errors() -> bool:
    return _emit_propagate_errors.get()


def set_emit_context(
    *,
    session: AsyncSession | None,
    propagate_errors: bool,
) -> tuple[object, object]:
    return (
        _emit_session.set(session),
        _emit_propagate_errors.set(propagate_errors),
    )


def reset_emit_context(tokens: tuple[object, object]) -> None:
    session_token, propagate_token = tokens
    _emit_session.reset(session_token)  # type: ignore[arg-type]
    _emit_propagate_errors.reset(propagate_token)  # type: ignore[arg-type]
