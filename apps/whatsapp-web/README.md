# Vendelo360 — WhatsApp Web

Extensión Chrome/Chromium (Manifest V3) que inyecta una **barra lateral** en [WhatsApp Web](https://web.whatsapp.com) y muestra la ficha del contacto de la conversación abierta.

Diseñada para vendedores y proveedores. Sin backend ni CRM conectado todavía: la sección Cuenta usa valores de ejemplo.

## Requisitos

- Node.js 20+
- pnpm (monorepo)
- Chrome o Chromium

## Build

Desde la raíz del monorepo:

```bash
pnpm install
pnpm --filter @broker/whatsapp-web build
```

Salida: `apps/whatsapp-web/dist/` (incluye `manifest.json`, `content.js`, `icons/` y `fonts/`).

Modo watch (rebuild al editar):

```bash
pnpm --filter @broker/whatsapp-web dev
# o: pnpm dev:whatsapp-web
```

Tras cada build, en `chrome://extensions` usa **Reload** en la extensión.

## Instalar en Chrome (Load unpacked)

1. Compila primero (si aún no lo hiciste):
   ```bash
   pnpm --filter @broker/whatsapp-web build
   ```
2. Abre `chrome://extensions`.
3. Activa **Developer mode** (arriba a la derecha).
4. Pulsa **Load unpacked**.
5. Selecciona la carpeta **`dist`** (no `src` ni la raíz de la app):
   ```
   …/apps/whatsapp-web/dist
   ```
6. Comprueba que la extensión aparece como **Vendelo360** y está **Enabled**.
7. Abre o **recarga por completo** `https://web.whatsapp.com` (F5 o cerrar pestaña y abrir de nuevo).
8. Inicia sesión si hace falta y **abre una conversación**.
9. A la derecha deberías ver el panel **Vendelo360** con el contacto detectado.
10. Cambia a otro chat: el panel debe actualizarse al nuevo contacto.

### Si no ves nada

1. En `chrome://extensions` → la extensión → **Errors**: no debería haber errores de carga.
2. En WhatsApp Web abre DevTools (F12) → consola. Debe aparecer:
   ```
   [Vendelo360] sidebar host mounted
   [Vendelo360] ready …
   ```
   Si ves `process is not defined`, vuelve a hacer `pnpm --filter @broker/whatsapp-web build` y **Reload** la extensión.
3. En Elements busca `#vendelo-wa-root`. Si no está, el content script no se inyectó (URL distinta, extensión deshabilitada, o hay que recargar la pestaña).
4. Tras cada rebuild: **Reload** en `chrome://extensions` y luego recarga WhatsApp Web.

## Cómo se detecta el chat actual

WhatsApp Web no ofrece API pública para extensiones. La extensión lee el DOM:

1. Espera a que exista `#app` (carga / QR).
2. Conversación abierta = `#main` o `header[data-testid="conversation-header"]`.
3. **Nombre** (en orden):
   - Primer texto útil en `header[data-testid="conversation-header"]` (salta iconos `wds-ic-*`).
   - Atributos `title` del header.
   - Chat seleccionado en `#pane-side`.
   - `document.title` (sin el sufijo “WhatsApp”).
4. **Teléfono** (en orden, solo chats 1:1 — los **grupos no tienen teléfono**):
   - Si el título ya es un número.
   - Panel **Datos del contacto** cuando el usuario lo abre (una sola vez: si no hay número, se marca como no obtenible).
   - Metadatos de mensajes / `data-id` con `@c.us` (no se usan teléfonos de participantes en grupos).
5. Si es grupo, o el panel de info se abrió y no dio número: el teléfono queda en **No se pudo obtener** y no se vuelve a intentar para ese chat.

La UI React vive en un **Shadow DOM** para no pelear con los estilos de WhatsApp.

## Limitaciones conocidas

| Limitación | Detalle |
|---|---|
| DOM no contratado | Meta puede cambiar markup en cualquier momento y romper selectores. |
| Teléfono no siempre visible | Contactos guardados / IDs `@lid` a menudo no exponen el número en el DOM. |
| Grupos | Se muestra el **nombre del grupo**; no hay un único teléfono. |
| Layout | Si el selector de layout falla, el panel fijo puede solaparse un poco. |
| Términos de uso | Solo lectura de UI visible. No automatiza chats ni scrapea masivamente. |
| Sin CRM | Los datos de cuenta (estado, compras, pedido) son de ejemplo hasta conectar el backend. |

### Detalle: teléfono

El teléfono **solo** aparece cuando WhatsApp lo deja en la UI:

1. El título del chat **es** el número (contacto no guardado), o
2. Está en `data-pre-plain-text` de burbujas entrantes, o
3. Queda un `data-id` legado con `@c.us`.

Si no, la ficha muestra **No disponible**. No abrimos el panel de contacto ni usamos APIs internas.

Si tras un rediseño el nombre deja de detectarse, inspecciona el header en DevTools y ajusta `src/detect-chat.ts`.

## Estructura

```
apps/whatsapp-web/
  public/manifest.json
  public/icons/
  public/fonts/
  src/
    content.ts          # bootstrap
    detect-chat.ts      # detección (sin React)
    layout.ts           # reserva de ancho
    customer.ts         # ficha a partir del chat detectado
    sidebar/            # React + Shadow DOM
  dist/                 # cargar en Chrome
```

## Fuera de alcance (por ahora)

IA, backend, base de datos, autenticación, CRM, Odoo, envío automático de mensajes, historial completo, scraping masivo, WhatsApp Business API.
