from __future__ import annotations

from uuid import uuid4

import pytest
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy.exc import IntegrityError
from starlette.datastructures import Headers

from app.lib.exceptions import ApiError, raise_api_error, register_exception_handlers
from app.lib.exceptions.handlers import (
    api_error_handler,
    integrity_error_handler,
    validation_error_handler,
)
from app.lib.exceptions.validation import translate_validation_error
from app.services import stock as stock_service
from app.models.product.product import Product
from datetime import datetime, timezone


def _request() -> Request:
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
    return Request(scope)


def test_api_error_formats_spanish_message_and_serializes_uuid() -> None:
    product_id = uuid4()
    err = ApiError(
        "insufficient_stock",
        {
            "product_id": product_id,
            "product_name": "Arroz",
            "available": 2,
            "requested": 5,
        },
    )
    body = err.to_body()
    assert body == {
        "code": "insufficient_stock",
        "message": (
            "No hay stock suficiente de Arroz. Disponible: 2, solicitado: 5."
        ),
        "params": {
            "product_id": str(product_id),
            "product_name": "Arroz",
            "available": 2,
            "requested": 5,
        },
    }


def test_raise_api_error_raises_api_error() -> None:
    with pytest.raises(ApiError) as exc_info:
        raise_api_error("not_found")
    assert exc_info.value.status_code == 404
    assert exc_info.value.code == "not_found"


def test_reserve_stock_insufficient_includes_product_params() -> None:
    product = Product(
        id=uuid4(),
        organization_id=uuid4(),
        name="Aceite",
        stock=3,
        reserved=0,
        created_at=datetime.now(timezone.utc).replace(tzinfo=None),
    )
    with pytest.raises(ApiError) as exc_info:
        stock_service.reserve_stock(product, 10)
    assert exc_info.value.code == "insufficient_stock"
    assert exc_info.value.params["product_name"] == "Aceite"
    assert exc_info.value.params["available"] == 3
    assert exc_info.value.params["requested"] == 10


def test_translate_duplicate_product_validation() -> None:
    translated = translate_validation_error(
        {
            "type": "value_error",
            "loc": ("body", "items"),
            "msg": "Value error, Duplicate product_id in order items",
            "input": [],
        }
    )
    assert translated["code"] == "duplicate_product_id"
    assert "duplicados" in translated["message"]


@pytest.mark.asyncio
async def test_handlers_return_envelope() -> None:
    request = _request()

    conflict = await integrity_error_handler(
        request, IntegrityError("", {}, None)
    )
    assert conflict.status_code == 409
    assert b'"code":"conflict"' in conflict.body

    stock_err = ApiError(
        "insufficient_stock",
        {
            "product_id": uuid4(),
            "product_name": "Arroz",
            "available": 1,
            "requested": 2,
        },
    )
    stock_response = await api_error_handler(request, stock_err)
    assert stock_response.status_code == 409
    assert b'"code":"insufficient_stock"' in stock_response.body

    class Payload(BaseModel):
        quantity: int = Field(gt=0)

    try:
        Payload(quantity=0)
    except ValidationError as exc:
        response = await validation_error_handler(
            request, RequestValidationError(exc.errors())
        )
    assert response.status_code == 422
    assert b'"code":"validation_error"' in response.body
    assert b"mayor que 0" in response.body


def test_register_exception_handlers_wires_all() -> None:
    app = FastAPI()
    register_exception_handlers(app)
    assert ApiError in app.exception_handlers
    assert IntegrityError in app.exception_handlers
    assert RequestValidationError in app.exception_handlers
