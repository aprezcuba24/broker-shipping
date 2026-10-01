# Vendelo360 — Facebook

Extensión Chrome/Chromium (Manifest V3) que inyecta un **panel a la derecha** en Facebook (igual que la de WhatsApp Web) para preparar publicaciones de productos del broker. El texto incluye un enlace de WhatsApp con el nombre del producto y el código `FB{public_code}`. **Publicar lo pulsas tú** en Facebook.

## Requisitos

- Node.js 20+
- pnpm (monorepo)
- Chrome o Chromium
- Teléfono configurado en el perfil del vendedor (`GET /users/me`)

## Build

Desde la raíz del monorepo:

```bash
pnpm install
pnpm --filter @broker/facebook build
```

Salida: `apps/extensions/facebook/dist/` (incluye `manifest.json`, `content.js`, `background.js`, `popup.html`, `icons/` y `config/groups.json`).

Modo watch:

```bash
pnpm --filter @broker/facebook dev
# o: pnpm dev:facebook
```

## Grupos de prueba

Edita [`config/groups.json`](config/groups.json) y vuelve a compilar:

```json
{
  "groups": [
    {
      "name": "Grupo de prueba",
      "url": "https://www.facebook.com/groups/123456789"
    }
  ]
}
```

## Instalar en Chrome (Load unpacked)

1. Compila: `pnpm --filter @broker/facebook build`
2. Abre `chrome://extensions`
3. Activa **Developer mode**
4. **Load unpacked** → selecciona `apps/extensions/facebook/dist` (si ya estaba cargada, **Reload**)
5. Abre o recarga Facebook: a la **derecha** aparece el panel Vendelo360 (como en WhatsApp)
6. Si no hay sesión, pulsa **Iniciar sesión** en el panel (abre el popup)
7. Busca un producto → **Preparar en este grupo** → en Facebook pulsa **Publicar**

Antes de probar, edita `config/groups.json` con URLs reales de grupos y vuelve a compilar. El API debe estar levantado.

Variables útiles:

```bash
VITE_API_URL=http://localhost:8000
VITE_SELLER_URL=http://localhost:5174
# Misma base pública de imágenes que el backend (opcional; se lee del .env del monorepo):
# S3_PUBLIC_BASE_URL=http://localhost:19000/broker-local
```

Las fotos salen del broker (`image_url` en `GET /products/seller`). Esa URL suele apuntar al object storage, no a la API. En el build, el origen de `S3_PUBLIC_BASE_URL` se añade a `host_permissions` para que el service worker pueda descargar la imagen y adjuntarla en Facebook. Si falta, la extensión prepara el texto igual y te pide adjuntar la foto a mano.

La autenticación de vendedor vive en `@broker/extension-auth` (compartida con la extensión de WhatsApp).
