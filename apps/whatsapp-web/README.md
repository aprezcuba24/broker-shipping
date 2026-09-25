# Vendelo360 — WhatsApp Web

Extensión Chrome/Chromium (Manifest V3) que inyecta una **barra lateral** en [WhatsApp Web](https://web.whatsapp.com) y muestra la ficha del contacto de la conversación abierta.

Diseñada para vendedores. El login vive en el **popup** de la extensión; la organización se elige en el sidebar si hay más de una. Con teléfono detectado, el panel consulta el backend (cliente, dirección y último pedido) vía el service worker.

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

## Instalación para vendedores

Los vendedores instalan desde la **Chrome Web Store** (ficha unlisted). En la app seller, **Configurar** (`/settings`) abre esa ficha y comprueba si la extensión ya está instalada.

Procedimiento para publicar y actualizar (cuenta developer, zip, versiones): **[docs/publicar_extension.md](../../docs/publicar_extension.md)**. Chrome reparte las actualizaciones solo; no uses Load unpacked en producción.

## Instalar en Chrome (desarrollo local — Load unpacked)

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

Variables útiles en el build (raíz del monorepo):

```bash
VITE_API_URL=http://localhost:8000
VITE_SELLER_URL=http://localhost:5174
# Tras publicar en la tienda (ver docs/publicar_extension.md):
# VITE_WHATSAPP_EXTENSION_KEY=...   # mismo ID que la ficha
# VITE_WHATSAPP_EXTENSION_ID=...    # en el build del seller
```

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

## Autenticación (vendedores)

1. Tras cargar la extensión, haz clic en el icono **Vendelo360** (o en “Iniciar sesión” del sidebar).
2. Inicia sesión con email y contraseña de vendedor (`POST /users/login` contra `VITE_API_URL`).
3. Abre WhatsApp Web:
   - **1 organización** vendedora → el panel entra directo a la ficha.
   - **Varias** → el sidebar pide elegir organización (primer paso).
   - **Ninguna** → el sidebar indica crear/unirse desde la web seller.
4. Cerrar sesión: desde el popup.

La sesión (JWT + org activa) se guarda en `chrome.storage.local`, no en el `localStorage` de WhatsApp. El content script nunca muestra el formulario de contraseña ni ve el JWT: las llamadas al API las hace solo el **service worker**.

Variables de entorno al build (raíz del monorepo o shell):

```bash
VITE_API_URL=http://localhost:8000
VITE_SELLER_URL=http://localhost:5174   # enlace “web de vendedores” + externally_connectable
pnpm --filter @broker/whatsapp-web build
```

Publicación en la tienda y variables `VITE_WHATSAPP_EXTENSION_*`: [docs/publicar_extension.md](../../docs/publicar_extension.md).

## Ficha CRM (cliente por teléfono)

Con sesión `ready` y un teléfono detectado en un chat 1:1, el sidebar pide al background un `LOOKUP_CUSTOMER`. El service worker compone:

1. `GET /customers/seller/?organization_id=&phone=` — filtro parcial (`ILIKE`); la extensión elige match exacto / único / prefijo-sufijo.
2. `GET /orders/seller/?organization_id=&search=` — pedidos recientes; se toma el primero del cliente encontrado.

En la UI:

- **Dirección** si el cliente tiene `address` en el CRM.
- **Último pedido**: código, estado y fecha, o `—`.

### Probar el flujo

1. Login en el popup → organización lista.
2. En WhatsApp Web, abre un chat 1:1 cuyo teléfono sea visible.
3. En **Último pedido** deberías ver código, estado y fecha (o `—` si no hay ficha o pedidos).

## Limitaciones conocidas

| Limitación | Detalle |
|---|---|
| DOM no contratado | Meta puede cambiar markup en cualquier momento y romper selectores. |
| Teléfono no siempre visible | Contactos guardados / IDs `@lid` a menudo no exponen el número en el DOM. |
| Grupos | No hay un único teléfono; la ficha no muestra el nombre (ya está en el chat). |
| Layout | Si el selector de layout falla, el panel fijo puede solaparse un poco. |
| Términos de uso | Solo lectura de UI visible. No automatiza chats ni scrapea masivamente. |
| Match parcial en API | El listado de clientes usa `ILIKE` y los pedidos `search`; no hay endpoint exacto por teléfono. |
| JWT sin refresh | Tras ~24 h hay que volver a iniciar sesión. |

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
  popup.html            # entrada del popup de auth
  manifest.shared.ts    # genera dist/manifest.json en el build
  public/icons|fonts/
  src/
    content.ts          # bootstrap content script
    auth/               # sesión, storage, mensajes (sin HTTP)
    services/           # capa HTTP al backend (auth, customer, …)
    background/         # service worker (sesión + proxy API)
    popup/              # UI de login (solo auth)
    detect-chat.ts
    sidebar/            # React + Shadow DOM + gating de org
  dist/                 # cargar en Chrome (Load unpacked)
```

## Fuera de alcance (por ahora)

IA, Odoo, envío automático de mensajes, historial completo, scraping masivo, WhatsApp Business API, registro/forgot-password en la extensión, cambiar de organización una vez autenticado, endpoint dedicado de lookup en el API.
