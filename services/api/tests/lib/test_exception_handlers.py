from __future__ import annotations

import pytest
from fastapi import FastAPI, Request
from sqlalchemy.exc import IntegrityError
from starlette.datastructures import Headers

from app.lib.exceptions.api_error import ApiError
from app.lib.exceptions.handlers import (
    integrity_error_handler,
    register_exception_handlers,
)


@pytest.mark.asyncio
async def test_integrity_error_handler_returns_409_conflict() -> None:
    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": "POST",
        "scheme": "http",
        "path": "/test",
        "raw_path": b"/test",
        "query_string": b"",
        "headers": Headers().raw,
        "client": ("127.0.0.1", 123),
        "server": ("test", 80),
    }
    request = Request(scope)
    response = await integrity_error_handler(request, IntegrityError("", {}, None))

    assert response.status_code == 409
    body = response.body
    assert b'"code":"conflict"' in body
    assert b'"message":"Ya existe un registro con esos datos."' in body


def test_register_exception_handlers_wires_handlers() -> None:
    app = FastAPI()
    register_exception_handlers(app)
    assert IntegrityError in app.exception_handlers
    assert ApiError in app.exception_handlers
