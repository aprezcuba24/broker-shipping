# Cloudflare Workers — landing (@broker/landing)

Sitio estático vía **Workers Static Assets** (dashboard: Workers & Pages).

| Setting | Value |
|---------|--------|
| Root directory | `/` (raíz del monorepo) |
| Build command | `pnpm install && pnpm --filter @broker/landing build` |
| Deploy command | `npx wrangler deploy --config apps/landing/wrangler.jsonc` |
| Custom domains | `vendeya.app` (apex) + `www` → 301 al apex |

Build env: `PUBLIC_SITE_URL=https://vendeya.app`

Config: [`wrangler.jsonc`](./wrangler.jsonc) — solo `assets.directory` (sin `main`). Si ves "Hello world", el deploy no usó este config.

Ver [`docs/deploy_railway.md`](../../docs/deploy_railway.md).
