# Orden: campos pendientes para copiar como texto

El botón **Copiar orden** en el detalle (vendedor y proveedor) genera un texto con los datos que ya existen en `OrderPublic`. Estos campos salen en los formatos de mensajería habituales pero **aún no se incluyen** (faltan en el modelo o se omitieron a propósito). Cuando se implementen, habrá que ampliar `formatOrderClipboardText` en `packages/ui/src/order/format-order-clipboard.ts`.

## Pendientes

### Vuelto
- **Uso:** línea tipo «💴 Vuelto» por ítem.
- **Estado:** el dato ya existe (`OrderItem.customer_change` / `OrderItemPublic.customer_change`), pero se omitió del texto copiado por ahora.
- **Posible origen:** volver a incluir `formatMoney(item.customer_change)` en el bloque de producto de `formatOrderClipboardText`.

### Hora de entrega
- **Uso:** línea tipo «⏰ Hora de entrega».
- **Estado:** no hay campo en `Order` ni en el cliente. Hoy solo se copia `created_at` como fecha de la orden.
- **Posible origen:** nuevo campo en la orden (p. ej. `delivery_at` / `delivery_time`) al crear o editar.

### Punto de referencia
- **Uso:** línea tipo «📍 Punto de referencia».
- **Estado:** la dirección copiada usa calle + barrio + municipio + provincia (`formatAddressLine`). No hay un campo aparte de referencia.
- **Posible origen:** campo opcional en la dirección del cliente o snapshot en la orden.

### Notas adicionales
- **Uso:** bloque «📝 Notas adicionales».
- **Estado:** `Product.notes` existe, pero no se copia al ítem de la orden ni hay notas a nivel de orden.
- **Posible origen:** `notes` en `Order` (y/o snapshot de notas de producto en `OrderItem`).

### Teléfono del gestor
- **Uso:** en la sección de logística / gestor.
- **Estado:** `User.phone` existe, pero la orden solo guarda el nombre de la organización vendedora (`seller_organization_name`). No hay teléfono de organización ni del usuario creador en el snapshot.
- **Posible origen:** teléfono en `Organization`, o snapshot del teléfono del usuario/vendedor al crear la orden.

### Tarjeta para transferencia de comisión
- **Uso:** línea tipo «Tarjeta para transferencia de comisión».
- **Estado:** no existe en ningún modelo (`Organization`, `User`, `Order`, comisión).
- **Posible origen:** dato de pago/comisión en la organización vendedora o en el perfil del gestor, con snapshot en la orden si debe quedar fijo al momento del pedido.
