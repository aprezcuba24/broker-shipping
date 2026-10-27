# Cloudflare Workers — tienda pública (@broker/store)

| Setting | Value |
|---------|--------|
| Root directory | `/` |
| Build command | `pnpm install && pnpm --filter @broker/store build` |
| Deploy command | `npx wrangler deploy` |
| Preview command | `npx wrangler versions upload` |
| Custom domain | `tienda.vendeya.app` |

Build env:

- `VITE_API_URL=https://api.vendeya.app`
- `VITE_SELLER_ORGANIZATION_ID=<uuid de la org vendedora>`
- `VITE_WHATSAPP_PHONE=<teléfono E.164, p. ej. 5355512345>`

Config: [`wrangler.jsonc`](./wrangler.jsonc) (`not_found_handling`: SPA). El build lo publica en la raíz del monorepo.

Ver [`docs/deploy_railway.md`](../../docs/deploy_railway.md).
