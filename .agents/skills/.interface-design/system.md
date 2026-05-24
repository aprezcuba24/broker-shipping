# Broker B2B — Design System

## Direction

B2B broker platform for suppliers and global administration. Calm, analytical, trustworthy — not flashy marketing. Users manage catalogs, organizations, and operations in focused sessions.

## Feel

- **Temperature:** Cool-neutral with subtle warmth in surfaces (Stitch "Analytical Lens" palette)
- **Density:** Comfortable — readable tables and forms, not cramped trading-terminal density
- **Depth:** Surface elevation via subtle color shifts + low-opacity borders (no heavy shadows)

## Typography

- **Headlines:** Manrope — geometric, confident, professional
- **Body:** Inter — neutral, highly readable for data and forms
- **Scale:** Headlines use `font-headline`; body defaults to `font-body`

## Color tokens

Reuses Stitch design tokens ported to Tailwind v4 via `@broker/ui/styles.css`:

- **Canvas:** `background`, `surface`, `surface-container-low`
- **Text:** `on-surface`, `on-surface-variant`, shadcn `foreground` / `muted-foreground`
- **Brand:** `ds-primary`, `primary-dim`, `on-primary`
- **Semantic:** `destructive`, `error`, `tertiary` (success-adjacent accents)

## Spacing

Base unit: **4px** (Tailwind default). Use multiples: `p-4`, `p-6`, `gap-2`, `gap-4`.

## Components

| Pattern | Usage |
|---------|-------|
| `AppLayout` + `Sidebar` + `TopHeader` | All authenticated app screens |
| `Card` | Page sections, placeholders, forms |
| `Button` | Primary actions; `outline` for secondary |
| shadcn inputs | Forms when business logic arrives |

## Branding

- **Product name:** Broker
- **Backoffice subtitle:** Portal proveedores
- **Admin subtitle:** Administración global
- **Do not use:** "The Lens", "QR Pay", "Backoffice Intel"

## Depth strategy

Borders-only with whisper-quiet surface elevation. Sidebar uses `surface-container-low` (same temperature as canvas). Active nav items lift to `surface-container-lowest` with subtle shadow.
