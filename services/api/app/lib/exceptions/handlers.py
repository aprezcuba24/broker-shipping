from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.lib.exceptions.constants import DEFAULT_CONFLICT_DETAIL


async def integrity_error_handler(
    request: Request,
    exc: IntegrityError,
) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={"detail": DEFAULT_CONFLICT_DETAIL},
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(IntegrityError, integrity_error_handler)
