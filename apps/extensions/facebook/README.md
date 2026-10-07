# Vendelo360 — Facebook

Extensión Chrome/Chromium (Manifest V3) que inyecta un **panel a la derecha** en Facebook. Lista los anuncios (`AdsMessage`) de la organización vendedora. La publicación en grupos se definirá más adelante.

## Requisitos

- Node.js 20+
- pnpm (monorepo)
- Chrome o Chromium
- API del broker levantada

## Build

Desde la raíz del monorepo:

```bash
pnpm install
pnpm --filter @broker/facebook build
```

Salida: `apps/extensions/facebook/dist/` (incluye `manifest.json`, `content.js`, `background.js`, `popup.html` e `icons/`).

Modo watch:

```bash
pnpm --filter @broker/facebook dev
# o: pnpm dev:facebook
```

## Instalar en Chrome (Load unpacked)

1. Compila: `pnpm --filter @broker/facebook build`
2. Abre `chrome://extensions`
3. Activa **Developer mode**
4. **Load unpacked** → selecciona `apps/extensions/facebook/dist` (si ya estaba cargada, **Reload**)
5. Abre o recarga Facebook: a la **derecha** aparece el panel Vendelo360
6. Si no hay sesión, pulsa **Iniciar sesión** en el panel (abre el popup)
7. El panel muestra los anuncios de la organización seller (foto, título y código)

Variables en [`apps/extensions/facebook/.env`](.env) (copia de [`.env.example`](.env.example)). El build las embebe en el bundle y en `manifest.json`. Si falta alguna, se usa el `.env` de la raíz del monorepo. Una variable ya exportada en el shell pisa el archivo.

```bash
VITE_API_URL=https://api.vendelo360.app
VITE_SELLER_URL=https://gestores.vendelo360.app
VITE_CDN_URL=https://vendeya-prod.s3.us-east-1.amazonaws.com
```

La autenticación de vendedor vive en `@broker/extension-auth` (compartida con la extensión de WhatsApp).
