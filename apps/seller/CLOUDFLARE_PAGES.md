# Cloudflare Workers — portal gestores (@broker/seller)

| Setting | Value |
|---------|--------|
| Root directory | `/` |
| Build command | `pnpm install && pnpm --filter @broker/seller build` |
| Deploy command | `npx wrangler deploy --config apps/seller/wrangler.jsonc` |
| Custom domain | `gestores.vendeya.app` |

Build env: `VITE_API_URL=https://api.vendeya.app`

Config: [`wrangler.jsonc`](./wrangler.jsonc) (`not_found_handling`: SPA).

Ver [`docs/deploy_railway.md`](../../docs/deploy_railway.md).
