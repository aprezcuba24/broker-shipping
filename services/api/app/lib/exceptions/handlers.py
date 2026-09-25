from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.lib.exceptions.api_error import ApiError
from app.lib.exceptions.catalog import ERRORS
from app.lib.exceptions.validation import translate_validation_error


async def api_error_handler(_request: Request, exc: ApiError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=exc.to_body())


async def integrity_error_handler(
    _request: Request,
    _exc: IntegrityError,
) -> JSONResponse:
    return JSONResponse(
        status_code=ERRORS["conflict"].status_code,
        content=ApiError("conflict").to_body(),
    )


async def validation_error_handler(
    _request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    errors = [translate_validation_error(err) for err in exc.errors()]
    if len(errors) == 1:
        message = errors[0]["message"]
    elif errors:
        message = " ".join(item["message"] for item in errors)
    else:
        message = ERRORS["validation_error"].template

    body = ApiError(
        "validation_error",
        {"errors": errors},
        message=message,
    ).to_body()
    return JSONResponse(status_code=422, content=body)


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(ApiError, api_error_handler)
    app.add_exception_handler(IntegrityError, integrity_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
