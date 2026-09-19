# Broker WhatsApp Web — POC

Extensión Chrome/Chromium (Manifest V3) que inyecta una **barra lateral** en [WhatsApp Web](https://web.whatsapp.com) y muestra el **nombre del contacto** de la conversación abierta, junto con datos ficticios de demostración.

**Solo es una prueba de concepto.** No hay backend, IA, CRM, envío de mensajes ni lectura del historial.

## Requisitos

- Node.js 20+
- pnpm (monorepo Broker)
- Chrome o Chromium

## Build

Desde la raíz del monorepo:

```bash
pnpm install
pnpm --filter @broker/whatsapp-web build
```

Salida: `apps/whatsapp-web/dist/` (incluye `manifest.json`, `content.js` e `icons/`).

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
   …/broker/apps/whatsapp-web/dist
   ```
6. Comprueba que la extensión aparece como **Broker WhatsApp Web POC** y está **Enabled**.
7. Abre o **recarga por completo** `https://web.whatsapp.com` (F5 o cerrar pestaña y abrir de nuevo).
8. Inicia sesión si hace falta y **abre una conversación**.
9. A la derecha deberías ver el panel **Información** con el nombre detectado y datos mock.
10. Cambia a otro chat: el panel debe actualizarse al nuevo contacto.

### Si no ves nada

1. En `chrome://extensions` → la extensión → **Errors**: no debería haber errores de carga.
2. En WhatsApp Web abre DevTools (F12) → consola. Debe aparecer:
   ```
   [Broker WA POC] sidebar host mounted
   [Broker WA POC] ready …
   ```
   Si ves `process is not defined`, vuelve a hacer `pnpm --filter @broker/whatsapp-web build` y **Reload** la extensión.
3. En Elements busca `#broker-wa-poc-root`. Si no está, el content script no se inyectó (URL distinta, extensión deshabilitada, o hay que recargar la pestaña).
4. Tras cada rebuild: **Reload** en `chrome://extensions` y luego recarga WhatsApp Web.

## Cómo se detecta el chat actual

WhatsApp Web no ofrece API pública para extensiones. La POC lee el DOM:

1. Espera a que exista `#app` (carga / QR).
2. Considera conversación abierta si existe `#main`.
3. Lee el nombre desde `#main header`:
   - Preferencia: `span[title]` / `div[title]` cuyo `title` no sea texto de UI (`en línea`, `online`, `escribiendo…`, etc.).
   - Fallback: primer `span[dir="auto"]` del header que no sea ruido de UI.
4. Un `MutationObserver` (con debounce ~100 ms) observa cambios en el header / árbol de `#app` y vuelve a detectar el nombre.
5. El teléfono solo se rellena si el propio título parece un número (`+` y dígitos). En contactos guardados WhatsApp suele mostrar el **nombre**, no el número.

La UI React vive en un **Shadow DOM** para no pelear con los estilos de WhatsApp.

## Limitaciones conocidas

| Limitación | Detalle |
|---|---|
| DOM no contratado | Meta puede cambiar markup/clases en cualquier momento y romper selectores. |
| Teléfono poco fiable | Solo si el header muestra un número; contactos con nombre → “No disponible”. |
| Grupos | Se muestra el **nombre del grupo**, no un “contacto” individual. |
| Layout | Se intenta reducir el ancho del shell de WA; si el selector falla, el panel fijo puede solaparse un poco. |
| Términos de uso | Solo lectura de UI visible. No automatiza chats ni scrapea masivamente. |
| Sin persistencia | Los datos de la ficha son hardcodeados; no hay API ni CRM. |

Si tras un rediseño de WhatsApp Web el nombre deja de detectarse, inspecciona `#main header` en DevTools y ajusta `src/detect-chat.ts` con el selector más estable disponible.

## Estructura

```
apps/whatsapp-web/
  public/manifest.json
  public/icons/
  src/
    content.ts          # bootstrap
    detect-chat.ts      # detección (sin React)
    layout.ts           # reserva de ancho
    mock-customer.ts    # ficha ficticia
    sidebar/            # React + Shadow DOM
  dist/                 # cargar en Chrome
```

## Fuera de alcance (a propósito)

IA, backend, base de datos, autenticación, CRM, Odoo, envío automático de mensajes, historial completo, scraping masivo, WhatsApp Business API.
