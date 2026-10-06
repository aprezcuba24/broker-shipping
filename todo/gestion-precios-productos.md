# Futuro: precios y cobro de productos de plataforma

La fase de **acceso** (qué productos tiene habilitados cada organización) vive en `organization_platform_product`. Este documento describe cómo modelar **precios, cupos y consumo** más adelante, sin mezclarlo con la seguridad de los endpoints.

## Principio

| Capa | Responsabilidad |
|------|-----------------|
| `organization_platform_product` | ¿Puede usar el producto? (`enabled`) |
| Contrato de cobro (futuro) | ¿Cuánto paga y bajo qué reglas? |
| Eventos de uso (futuro) | ¿Cuánto consumió en el periodo? |
| Facturación (futuro) | Cobro real, impuestos, pasarela |

Una organización puede tener acceso habilitado pero aún no tener contrato de precio (promoción, trial manual). El endpoint sigue validando solo `enabled`; el cobro es un proceso aparte.

## Catálogo de productos (referencia)

| Código | Nombre | Modelo de precio previsto |
|--------|--------|---------------------------|
| `provider_management` | Gestión de productos de proveedores | Cuota **fija mensual** por organización |
| `phone_blacklist` | Lista negra | **Consumo** por consulta de estado (`GET /phone-blacklist/status`) o cuota fija si se negocia precio único |
| `facebook_publishing` | Publicación en Facebook | **Consumo** por publicación (`facebook_post`) |

El catálogo (`platform_product`) puede incluir más adelante `allowed_billing_modes` para validar que un contrato solo use modos permitidos para ese producto.

## Contrato por organización y producto

Tabla propuesta: **`organization_platform_product_terms`** (1 fila “vigente” por par org + producto, o historial con `valid_from` / `valid_to`).

Campos sugeridos:

- `organization_platform_product_id` o `(organization_id, platform_product_id)` FK
- `billing_mode`: `fixed_monthly` | `usage` | `hybrid`
- `currency` (p. ej. USD, CUP según negocio)
- `monthly_amount` — cuota fija o componente base en híbrido
- `included_units` — unidades incluidas en el periodo (0 si es solo fijo o solo puro consumo sin cupo)
- `unit_amount` — precio por unidad extra (o por unidad si no hay cuota base)
- `meter_code` — qué se mide (ver medidores abajo)
- `period_anchor` — día del mes en que empieza el ciclo (p. ej. 1)
- `allow_overage` — si al agotar el cupo se cobra extra (`true`) o se bloquea el uso medido (`false`)
- `valid_from`, `valid_to` — vigencia del contrato

### Modos de cobro

**`fixed_monthly`**

- Cobra `monthly_amount` una vez por periodo.
- No requiere medidor obligatorio (opcional para reporting).

**`usage`**

- Cobra `used_units * unit_amount` (o solo unidades por encima de `included_units` si se usa cupo 0 + included).
- Requiere `meter_code` y registro en `platform_product_usage`.

**`hybrid`**

- Cobra `monthly_amount` + excedente: `max(0, used - included_units) * unit_amount`.
- Típico para lista negra: base mensual + N consultas incluidas + precio por consulta extra.

## Medidores (`meter_code`)

| Medidor | Cuándo incrementar | Producto |
|---------|-------------------|----------|
| `blacklist_status_lookup` | Cada `GET /phone-blacklist/status` exitoso | `phone_blacklist` |
| `facebook_post` | Cada publicación confirmada (extensión / evento futuro) | `facebook_publishing` |

Para `provider_management` no hace falta medidor si el precio es solo mensual fijo.

Los eventos deben ser **idempotentes** (clave por request o por acción de negocio) para no duplicar consumo en reintentos.

## Tabla de uso

**`platform_product_usage`** (append-only):

- `organization_id`, `platform_product_id`, `meter_code`
- `quantity` (normalmente 1)
- `occurred_at`
- `idempotency_key` (único)
- Metadatos opcionales (usuario, teléfono enmascarado, etc.) según privacidad

Agregación por periodo: `SUM(quantity)` entre `period_start` y `period_end` del contrato vigente.

## Cierre de periodo (job futuro)

Para cada org + producto con contrato activo:

1. Calcular `used` desde `platform_product_usage`.
2. Según `billing_mode`:
   - **fixed_monthly:** línea = `monthly_amount`
   - **usage:** línea = `(used - included_units)` positivo × `unit_amount` (o `used × unit_amount` si no hay cupo)
   - **hybrid:** línea = `monthly_amount` + excedente como arriba
3. Generar borrador de factura / cargo interno (tabla futura `billing_invoice`).

## Enforcement en runtime (futuro, además de `product_not_enabled`)

Si `allow_overage` es **false** y `used >= included_units` en el periodo actual:

- El endpoint que emite el medidor responde **403** con código `quota_exceeded` (distinto de `product_not_enabled`).
- El acceso al producto (`enabled`) puede seguir en true; solo se bloquea la acción medida.

Si `allow_overage` es **true**, se permite la acción y el excedente entra en el cierre de periodo.

## Ejemplos comerciales

**Proveedor — gestión de catálogo**

- Modo: `fixed_monthly`
- `monthly_amount`: 50 USD
- Sin medidor.

**Vendedor — solo lista negra**

- Modo: `usage` o `hybrid`
- Ejemplo híbrido: 10 USD/mes + 500 consultas incluidas + 0.02 USD por consulta extra, `allow_overage: true`.

**Facebook (futuro)**

- Modo: `usage`
- `unit_amount` por publicación o paquete de 100 publicaciones vía `included_units` + excedente.

## Fuera de alcance inicial de cobro

- Pasarela de pago (Stripe, transferencia manual, etc.)
- Impuestos y numeración fiscal
- UI de backoffice para editar contratos (el PUT actual solo gestiona **acceso**, no precios)
- Prorrateo al alta/baja a mitad de mes (política a definir)
- Multi-moneda en una misma factura

## Orden de implementación sugerido

1. Acceso por producto (hecho en API: `organization_platform_product` + deps).
2. Medición en endpoints acordados + `platform_product_usage`.
3. `organization_platform_product_terms` + lectura de contrato vigente.
4. `quota_exceeded` en rutas medidas.
5. Job de cierre de periodo + entidad de factura borrador.
6. Integración de pago y pantallas admin.
