# @broker/landing

Landing de prelanzamiento de **VendeYa** (Astro 7 + Tailwind 4).

## Desarrollo

Desde la raíz del monorepo:

```bash
pnpm dev:landing
```

Abre [http://localhost:5176](http://localhost:5176).

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Landing completa |
| `/registro` | Formulario de interés (Google Forms) |

## Variables

- `PUBLIC_SITE_URL` — URL canónica para OG tags (por defecto `https://vendeya.app`)

## Build

```bash
pnpm --filter @broker/landing build
```

Salida: `dist/`. En Cloudflare (Workers & Pages → Static Assets):

- Build: `pnpm install && pnpm --filter @broker/landing build`
- Deploy: `npx wrangler deploy` (el build deja `wrangler.jsonc` en la raíz del monorepo)
- Dominio apex: `vendeya.app`

Detalle: [`docs/deploy_railway.md`](../../docs/deploy_railway.md).
