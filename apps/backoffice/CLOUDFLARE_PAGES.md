# Cloudflare Workers — portal proveedores (@broker/backoffice)

| Setting | Value |
|---------|--------|
| Root directory | `/` |
| Build command | `pnpm install && pnpm --filter @broker/backoffice build` |
| Deploy command | `npx wrangler deploy --config apps/backoffice/wrangler.jsonc` |
| Custom domain | `proveedores.vendeya.app` |

Build env:

- `VITE_API_URL=https://api.vendeya.app`
- `VITE_SELLER_APP_URL=https://gestores.vendeya.app`

Config: [`wrangler.jsonc`](./wrangler.jsonc) (`not_found_handling`: SPA).

Ver [`docs/deploy_railway.md`](../../docs/deploy_railway.md).
