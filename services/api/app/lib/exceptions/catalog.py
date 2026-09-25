from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class ErrorDef:
    code: str
    status_code: int
    template: str


ERRORS: dict[str, ErrorDef] = {
    "insufficient_stock": ErrorDef(
        code="insufficient_stock",
        status_code=409,
        template=(
            "No hay stock suficiente de {product_name}. "
            "Disponible: {available}, solicitado: {requested}."
        ),
    ),
    "insufficient_reserved_stock": ErrorDef(
        code="insufficient_reserved_stock",
        status_code=409,
        template=(
            "No hay stock reservado suficiente de {product_name}. "
            "Reservado: {reserved}, solicitado: {requested}."
        ),
    ),
    "quantity_must_be_positive": ErrorDef(
        code="quantity_must_be_positive",
        status_code=422,
        template="La cantidad debe ser mayor que cero.",
    ),
    "email_already_registered": ErrorDef(
        code="email_already_registered",
        status_code=409,
        template="Ese correo ya está registrado.",
    ),
    "invalid_credentials": ErrorDef(
        code="invalid_credentials",
        status_code=401,
        template="Correo o contraseña incorrectos.",
    ),
    "email_not_verified": ErrorDef(
        code="email_not_verified",
        status_code=403,
        template="Debes verificar tu correo antes de continuar.",
    ),
    "invalid_or_expired_token": ErrorDef(
        code="invalid_or_expired_token",
        status_code=400,
        template="El enlace o token no es válido o ha expirado.",
    ),
    "email_already_verified": ErrorDef(
        code="email_already_verified",
        status_code=400,
        template="Este correo ya está verificado.",
    ),
    "not_authenticated": ErrorDef(
        code="not_authenticated",
        status_code=401,
        template="No estás autenticado.",
    ),
    "jwt_required": ErrorDef(
        code="jwt_required",
        status_code=403,
        template="Se requiere autenticación con JWT.",
    ),
    "super_admin_api_key": ErrorDef(
        code="super_admin_api_key",
        status_code=403,
        template="Los superadministradores no pueden crear claves de API.",
    ),
    "forbidden": ErrorDef(
        code="forbidden",
        status_code=403,
        template="No tienes permiso para realizar esta acción.",
    ),
    "not_found": ErrorDef(
        code="not_found",
        status_code=404,
        template="No encontrado.",
    ),
    "already_linked_to_provider": ErrorDef(
        code="already_linked_to_provider",
        status_code=400,
        template="Ya estás vinculado a este proveedor.",
    ),
    "link_request_already_pending": ErrorDef(
        code="link_request_already_pending",
        status_code=409,
        template="Ya hay una solicitud de vínculo pendiente.",
    ),
    "invitation_not_found": ErrorDef(
        code="invitation_not_found",
        status_code=404,
        template="Invitación no encontrada.",
    ),
    "invitation_not_pending": ErrorDef(
        code="invitation_not_pending",
        status_code=400,
        template="La invitación no está pendiente.",
    ),
    "invalid_invitation": ErrorDef(
        code="invalid_invitation",
        status_code=400,
        template="La invitación no es válida.",
    ),
    "invitation_email_mismatch": ErrorDef(
        code="invitation_email_mismatch",
        status_code=403,
        template="El correo de la invitación no coincide con el usuario autenticado.",
    ),
    "already_active_member": ErrorDef(
        code="already_active_member",
        status_code=409,
        template="Ya eres miembro activo de esta organización.",
    ),
    "invalid_invitation_type": ErrorDef(
        code="invalid_invitation_type",
        status_code=400,
        template="El tipo de invitación no es válido.",
    ),
    "invalid_seller_link_request": ErrorDef(
        code="invalid_seller_link_request",
        status_code=400,
        template="La solicitud de vínculo de vendedor no es válida.",
    ),
    "customers_ci_phone_conflict": ErrorDef(
        code="customers_ci_phone_conflict",
        status_code=409,
        template="El CI y el teléfono pertenecen a clientes distintos.",
    ),
    "invalid_status_transition": ErrorDef(
        code="invalid_status_transition",
        status_code=422,
        template=(
            "No se puede cambiar el estado de {current_label} a {target_label}."
        ),
    ),
    "commission_already_paid": ErrorDef(
        code="commission_already_paid",
        status_code=400,
        template="La comisión ya está pagada.",
    ),
    "conflict": ErrorDef(
        code="conflict",
        status_code=409,
        template="Ya existe un registro con esos datos.",
    ),
    "unlink_pending_commissions": ErrorDef(
        code="unlink_pending_commissions",
        status_code=409,
        template=(
            "No se puede desvincular la organización mientras existan "
            "comisiones pendientes de pago."
        ),
    ),
    "direction_required_for_correction": ErrorDef(
        code="direction_required_for_correction",
        status_code=422,
        template="La dirección es obligatoria en movimientos de corrección.",
    ),
    "validation_error": ErrorDef(
        code="validation_error",
        status_code=422,
        template="Hay errores de validación en la solicitud.",
    ),
}

ORDER_ITEM_STATUS_LABELS: dict[str, str] = {
    "created": "creado",
    "reviewed": "revisado",
    "sent": "enviado",
    "delivered": "entregado",
    "canceled": "cancelado",
}
