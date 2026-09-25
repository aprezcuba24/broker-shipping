from __future__ import annotations

from typing import Any

# Stable English messages raised from schema/normalize validators.
_CUSTOM_VALIDATION_MESSAGES: dict[str, tuple[str, str]] = {
    "must not be empty": (
        "must_not_be_empty",
        "No puede estar vacío.",
    ),
    "Duplicate product_id in order items": (
        "duplicate_product_id",
        "Hay productos duplicados en los ítems del pedido.",
    ),
    "Duplicate product_id in movement items": (
        "duplicate_product_id",
        "Hay productos duplicados en los ítems del movimiento.",
    ),
    "direction is required for correction movements": (
        "direction_required_for_correction",
        "La dirección es obligatoria en movimientos de corrección.",
    ),
    "direction is only allowed for correction movements": (
        "direction_only_for_correction",
        "La dirección solo se permite en movimientos de corrección.",
    ),
    "note is required when reason is other": (
        "note_required_for_other",
        "La nota es obligatoria cuando el motivo es otro.",
    ),
    "Unsupported image content type": (
        "unsupported_image_content_type",
        "Tipo de imagen no admitido.",
    ),
    "Invalid image key for this product": (
        "invalid_image_key",
        "La clave de imagen no es válida para este producto.",
    ),
}


def _loc_to_list(loc: tuple[Any, ...] | list[Any]) -> list[str | int]:
    return [part for part in loc if part != "body"]


def _field_label(loc: list[str | int]) -> str:
    if not loc:
        return "solicitud"
    return ".".join(str(part) for part in loc)


def translate_validation_error(error: dict[str, Any]) -> dict[str, Any]:
    """Map a Pydantic/FastAPI validation error item to Spanish code/message/params."""
    error_type = str(error.get("type") or "value_error")
    loc = _loc_to_list(tuple(error.get("loc") or ()))
    ctx = error.get("ctx") if isinstance(error.get("ctx"), dict) else {}
    raw_msg = str(error.get("msg") or "")

    # Strip Pydantic's "Value error, " prefix for custom validators.
    custom_key = raw_msg
    if custom_key.startswith("Value error, "):
        custom_key = custom_key[len("Value error, ") :]

    if custom_key in _CUSTOM_VALIDATION_MESSAGES:
        code, message = _CUSTOM_VALIDATION_MESSAGES[custom_key]
        return {
            "loc": loc,
            "code": code,
            "message": message,
            "params": {},
        }

    params: dict[str, Any] = {"field": _field_label(loc)}
    code = error_type
    message: str

    if error_type == "missing":
        message = "El campo {field} es obligatorio."
    elif error_type in {"greater_than", "greater_than_equal"}:
        limit = ctx.get("gt", ctx.get("ge"))
        params["limit"] = limit
        message = "El campo {field} debe ser mayor que {limit}."
        if error_type == "greater_than_equal":
            message = "El campo {field} debe ser mayor o igual que {limit}."
    elif error_type in {"less_than", "less_than_equal"}:
        limit = ctx.get("lt", ctx.get("le"))
        params["limit"] = limit
        message = "El campo {field} debe ser menor que {limit}."
        if error_type == "less_than_equal":
            message = "El campo {field} debe ser menor o igual que {limit}."
    elif error_type == "string_too_short":
        params["min_length"] = ctx.get("min_length")
        message = "El campo {field} es demasiado corto (mínimo {min_length})."
    elif error_type == "string_too_long":
        params["max_length"] = ctx.get("max_length")
        message = "El campo {field} es demasiado largo (máximo {max_length})."
    elif error_type == "too_short":
        params["min_length"] = ctx.get("min_length")
        message = "El campo {field} debe tener al menos {min_length} elemento(s)."
    elif error_type == "too_long":
        params["max_length"] = ctx.get("max_length")
        message = "El campo {field} debe tener como máximo {max_length} elemento(s)."
    elif error_type in {"uuid_parsing", "uuid_type"}:
        message = "El campo {field} debe ser un UUID válido."
    elif error_type in {"int_parsing", "int_type"}:
        message = "El campo {field} debe ser un número entero."
    elif error_type in {"float_parsing", "float_type"}:
        message = "El campo {field} debe ser un número."
    elif error_type in {"bool_parsing", "bool_type"}:
        message = "El campo {field} debe ser verdadero o falso."
    elif error_type == "enum":
        expected = ctx.get("expected")
        if expected is not None:
            params["expected"] = expected
            message = "El campo {field} debe ser uno de: {expected}."
        else:
            message = "El campo {field} no tiene un valor permitido."
    elif error_type in {"value_error.email", "email_parsing", "email_type"}:
        message = "El campo {field} debe ser un correo válido."
    elif "email" in error_type:
        message = "El campo {field} debe ser un correo válido."
    else:
        code = "invalid_value"
        message = "El campo {field} no es válido."

    try:
        formatted = message.format(**params)
    except (KeyError, ValueError):
        formatted = message

    return {
        "loc": loc,
        "code": code,
        "message": formatted,
        "params": params,
    }
