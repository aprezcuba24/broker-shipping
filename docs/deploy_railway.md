# Despliegue de menor costo: Railway + AWS + Cloudflare

Guía operativa para producción. Arquitectura:

| Pieza | Dónde | URL |
|-------|--------|-----|
| Landing (Astro) | Cloudflare Workers (static assets) | `https://vendelo360.app` (apex) |
| Portal proveedores | Cloudflare Workers (static assets) | `https://proveedores.vendelo360.app` |
| Portal gestores | Cloudflare Workers (static assets) | `https://gestores.vendelo360.app` |
| API FastAPI | Railway | `https://api.vendelo360.app` |
| Postgres | Railway (plugin) | red privada |
| Imágenes | AWS S3 | `S3_PUBLIC_BASE_URL` |
| Envío de correo | AWS SES (API HTTPS) | — |
| Recepción de correo | Cloudflare Email Routing | `info@` / `hola@` → Gmail |

Dominio de referencia: **vendelo360.app** (canónico en [`apps/landing`](../apps/landing)). Sustituye si usas otro.

---

## 1. Dominio y mapa DNS (Cloudflare)

### 1.1 Comprar / transferir el dominio

1. Entra en [Cloudflare Registrar](https://dash.cloudflare.com/) → **Domain Registration** (o añade el dominio y cambia nameservers).
2. Deja los **nameservers en Cloudflare** (necesario para CNAME flattening en el apex y Email Routing).
3. No uses Route 53 salvo que ya lo tengas: añade ~0.50 USD/zona + consultas.

### 1.2 Registros DNS

| Tipo | Nombre | Contenido / destino | Notas |
|------|--------|---------------------|--------|
| CNAME / apex | `@` | Target del Worker landing (custom domain) | Cloudflare CNAME flattening |
| CNAME / redirect | `www` | Redirect 301 → `https://vendelo360.app` | Redirect Rules o custom domain |
| CNAME | `proveedores` | Target del Worker backoffice | Tras añadir custom domain al Worker |
| CNAME | `gestores` | Target del Worker seller | Idem |
| CNAME | `api` | Target que da Railway (`xxx.up.railway.app`) | + TXT de verificación si Railway lo pide |
| CNAME ×3 | DKIM de SES | Valores de la consola SES | Easy DKIM |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:tu@email` | Endurecer a `p=quarantine` más adelante |
| MX + TXT | `mail` | Custom MAIL FROM de SES | Ver sección 5 |
| MX | `@` | Cloudflare Email Routing | Convive con el Worker en el apex |

`admin.` se deja para más adelante.

El apex puede tener **CNAME del Worker y MX de Email Routing a la vez**: el Worker de assets no usa MX.

SSL: lo emiten Cloudflare y Railway; no hace falta certificado comprado.

### 1.3 Checklist DNS

- [ ] Dominio en Cloudflare con nameservers activos
- [ ] Landing en apex + redirect `www` → apex
- [ ] `proveedores`, `gestores`, `api` apuntando
- [ ] Registros SES (DKIM, DMARC, MAIL FROM)
- [ ] Email Routing activo para `info@` / `hola@`

---

## 2. Railway: API + Postgres

### 2.1 Proyecto

1. Crea un proyecto en [Railway](https://railway.com/) (plan Hobby).
2. Añade **PostgreSQL** (plugin oficial).
3. Añade un servicio desde el repo GitHub, **root directory** `services/api` (o deja que `railway.toml` en la raíz del servicio lo indique).
4. Railway usará el [`Dockerfile`](../services/api/Dockerfile): migraciones Alembic al arrancar y luego Uvicorn en `$PORT`.

### 2.2 Variables de entorno (servicio API)

Copia / adapta (valores de ejemplo para `vendelo360.app`):

```bash
# Postgres: Variable Reference del plugin en ESTE servicio API (no solo en Postgres).
# Si ves localhost:6432, DATABASE_URL no está ligada aquí.
DATABASE_URL=${{Postgres.DATABASE_URL}}

JWT_SECRET=<genera-al-menos-32-caracteres-aleatorios>
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# CORS: fijo en código a allow_origins=["*"] (backend multi-cliente; auth = JWT / API keys).
# No hace falta CORS_ORIGINS en Railway.

FRONTEND_BACKOFFICE_URL=https://proveedores.vendelo360.app
FRONTEND_SELLER_URL=https://gestores.vendelo360.app

# Correo: SES API v2 sobre HTTPS (Hobby bloquea SMTP de salida).
# No hace falta SMTP_HOST / SMTP_USER / SMTP_PASSWORD en producción.
MAIL_FROM=noreply@vendelo360.app
EMAIL_VERIFICATION_TOKEN_HOURS=24
PASSWORD_RESET_TOKEN_HOURS=1

AWS_ACCESS_KEY_ID=<iam>
AWS_SECRET_ACCESS_KEY=<iam>
AWS_REGION=us-east-1
# Dejar vacío en producción AWS (no MinIO):
AWS_ENDPOINT_URL=
S3_BUCKET=vendeya-prod
S3_PUBLIC_BASE_URL=https://vendeya-prod.s3.us-east-1.amazonaws.com
```

### 2.3 Dominio custom de la API

En el servicio API → **Settings → Networking → Custom Domain** → `api.vendelo360.app`. Añade el CNAME (+ TXT) que indique Railway.

Hobby: máximo **2 dominios custom por servicio**; con solo `api.` basta.

### 2.4 Post-deploy

```bash
# Super-admin (ejecutar una vez vía Railway shell / one-off)
uv run python scripts/create_super_admin.py
```

Comprueba `https://api.vendelo360.app/docs` y `GET /`.

**No** despliegues Redis ni MinIO en Railway.

---

## 3. Cloudflare Workers & Pages: tres sitios estáticos

Cloudflare unificó el dashboard en **Workers & Pages**. Para sitios nuevos recomienda **Workers con Static Assets** (no el flujo Pages antiguo con solo “Build output directory”). Doc oficial: [Astro → Cloudflare](https://docs.astro.build/en/guides/deploy/cloudflare/), [Migrate Pages → Workers](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/).

Si el deploy muestra **“Hello world”**, Cloudflare desplegó el Worker de plantilla y **no** subió el `dist` de Astro/Vite. Hace falta un `wrangler.jsonc` con `assets.directory` (sin `main`) y un **Deploy command** que apunte a ese config.

Tres Workers (assets-only), mismo monorepo:

| Worker (`name` en wrangler) | App | Build | Deploy | Custom domain |
|-----------------------------|-----|-------|--------|---------------|
| `vendeya-landing` | [`apps/landing`](../apps/landing) | ver abajo | `npx wrangler deploy --config apps/landing/wrangler.jsonc` | `vendelo360.app` + `www` → apex |
| `vendeya-proveedores` | [`apps/backoffice`](../apps/backoffice) | ver abajo | `npx wrangler deploy --config apps/backoffice/wrangler.jsonc` | `proveedores.vendelo360.app` |
| `vendeya-gestores` | [`apps/seller`](../apps/seller) | ver abajo | `npx wrangler deploy --config apps/seller/wrangler.jsonc` | `gestores.vendelo360.app` |

Cada app tiene su [`wrangler.jsonc`](../apps/landing/wrangler.jsonc): solo `assets.directory = "./dist"` (relativo al fichero). **No** pongas `main` (eso es código Worker; sin assets solo servirías Hello World).

### 3.1 Crear el proyecto en el dashboard

1. [Workers & Pages](https://dash.cloudflare.com/) → **Create** / **Create application**.
2. **Import a repository** (GitHub) → el monorepo.
3. Ajustes (landing de ejemplo):

| Campo | Valor |
|-------|--------|
| Root directory | vacío / `/` (raíz del monorepo; pnpm workspaces) |
| Build command | `pnpm install && pnpm --filter @broker/landing build` |
| Deploy command | `npx wrangler deploy --config apps/landing/wrangler.jsonc` |
| Non-production deploy (si aparece) | `npx wrangler versions upload --config apps/landing/wrangler.jsonc` |

`--config apps/.../wrangler.jsonc` es **obligatorio** en monorepos: sin él, `npx wrangler deploy` falla con *“run in the root of a workspace instead of targeting a specific project”*.

Proveedores / gestores: mismos campos cambiando el filtro pnpm y la ruta del `--config`.

### 3.2 Variables de build

| Proyecto | Variable | Valor |
|----------|----------|--------|
| Landing | `PUBLIC_SITE_URL` | `https://vendelo360.app` |
| Proveedores | `VITE_API_URL` | `https://api.vendelo360.app` |
| Proveedores | `VITE_SELLER_APP_URL` | `https://gestores.vendelo360.app` |
| Gestores | `VITE_API_URL` | `https://api.vendelo360.app` |

### 3.3 SPA / 404

- Landing (Astro multipágina): `not_found_handling: "404-page"` en su wrangler.
- Portales React Router: `not_found_handling: "single-page-application"` en wrangler (no uses `public/_redirects`: en Workers Static Assets provoca error *Infinite loop detected*).

### 3.4 Si ya desplegaste y ves Hello World

1. Confirma que el commit en Git incluye `apps/landing/wrangler.jsonc`.
2. En Settings del Worker: Deploy command = `npx wrangler deploy --config apps/landing/wrangler.jsonc`.
3. Redeploy. El log **no** debe desplegar un script `main`; debe subir assets desde `apps/landing/dist`.

### 3.5 Orden de publicación

1. Landing en el apex (prelanzamiento; no depende de la API).
2. Email Routing.
3. API + Postgres en Railway.
4. Portales `proveedores` / `gestores`.

---

## 4. Imágenes: AWS S3

El API ya hace **presign + PUT directo del navegador** (`aioboto3`). En producción:

### 4.1 Bucket

1. Crea el bucket (p. ej. `vendeya-prod`) en la misma región que `AWS_REGION` (p. ej. `us-east-1`).
2. **Block Public Access:** puedes mantener el bucket “privado” a nivel de ACL y permitir lectura con una **bucket policy** de `s3:GetObject` (el catálogo necesita URLs públicas, igual que MinIO local con download anónimo).

Ejemplo de política de lectura pública de objetos:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadProductImages",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::vendeya-prod/*"
    }
  ]
}
```

3. **CORS del bucket** (`*` — el PUT de imagen es directo desde el navegador; apps de terceros también suben desde sus orígenes):

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### 4.2 IAM

Usuario (o rol) con política mínima sobre ese bucket **y** sobre SES (mismo usuario; el correo de producción usa la API HTTPS, no SMTP):

- `s3:PutObject`
- `s3:GetObject`
- `s3:DeleteObject`
- `s3:ListBucket` (opcional)
- `ses:SendEmail` / `ses:SendRawEmail` sobre la identidad `noreply@vendelo360.app` (o el dominio)

Access key → `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` en Railway.

### 4.3 Variables

```bash
AWS_ENDPOINT_URL=          # vacío = AWS real (no MinIO)
S3_BUCKET=vendeya-prod
S3_PUBLIC_BASE_URL=https://vendeya-prod.s3.us-east-1.amazonaws.com
AWS_REGION=us-east-1
```

No uses CloudFront al inicio. Si el egreso crece, valora Cloudflare R2 (compatible S3) cambiando `AWS_ENDPOINT_URL`.

### 4.4 Checklist S3

- [ ] Bucket + política GetObject
- [ ] CORS del bucket con `AllowedOrigins: ["*"]`
- [ ] IAM mínimo + keys en Railway
- [ ] `AWS_ENDPOINT_URL` vacío
- [ ] Prueba: subir imagen de producto desde proveedores

---

## 5. Correo: SES + Cloudflare Email Routing

**No** montes Postfix/Mailcow en Railway.

### 5.1 Envío (SES API HTTPS)

Railway **Hobby/Trial bloquea SMTP de salida** (puertos 25/465/587). Por eso la API envía con **SES API v2** (`sesv2.send_email`) sobre HTTPS (443), reutilizando `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION`. En local sigue SMTP → MailHog.

**No** uses un hostname de **SES Mail Manager** (`*.mail-manager-smtp.amazonaws.com`): es un ingress distinto y suele dar timeout desde Railway.

1. Consola AWS → **Amazon SES** → misma región que `AWS_REGION` (p. ej. `us-east-1`).
2. **Identities → Create → Domain** → `vendelo360.app`.
3. Publica en Cloudflare los CNAME de **Easy DKIM**.
4. **Custom MAIL FROM:** `mail.vendelo360.app` → añade MX + TXT SPF que indique SES.
5. TXT `_dmarc` en el apex (ver mapa DNS).
6. Asegura en el IAM (mismo usuario que S3) `ses:SendEmail` y `ses:SendRawEmail` sobre la identidad.
7. En Railway:

```bash
MAIL_FROM=noreply@vendelo360.app
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_ENDPOINT_URL=
# SMTP_* no hacen falta en producción (solo MailHog en local).
```

8. **Salida del sandbox:** SES → Account dashboard → Request production access. AWS pide sitio público (la landing en el apex sirve), política de uso y tipo de correo (transaccional: verificación, invitaciones).

Hasta salir del sandbox solo puedes enviar a direcciones verificadas.

### 5.2 Recepción (Cloudflare Email Routing)

1. Cloudflare → dominio → **Email → Email Routing** → Enable.
2. Destino: tu Gmail (o similar).
3. Direcciones: `info@vendelo360.app`, `hola@vendelo360.app` (y las que necesites).
4. No configures un buzón IMAP de pago hasta que haga falta.

Convive con el Worker de la landing en el apex (MX + CNAME flattening).

### 5.3 Checklist correo

- [ ] Dominio verificado en SES + DKIM
- [ ] Custom MAIL FROM `mail.`
- [ ] DMARC básico
- [ ] IAM con `ses:SendEmail` / `ses:SendRawEmail` + keys AWS en Railway
- [ ] `MAIL_FROM` = identidad verificada; sin host Mail Manager / SMTP en prod
- [ ] Production access (o emails de prueba verificados)
- [ ] Email Routing `info@` / `hola@`

---

## 6. Coste orientativo

| Pieza | Coste |
|-------|--------|
| Dominio (Cloudflare Registrar) | ~10–12 USD/año |
| Workers (static assets) + DNS + Email Routing | 0 |
| Railway Hobby (API + Postgres) | ~5–15 USD/mes |
| S3 | céntimos al inicio |
| SES | ~0.10 USD / 1000 emails |

---

## 7. Qué no hacer

- Postgres en RDS/EC2 solo “porque está en AWS”.
- MinIO o Redis en Railway (la API aún no usa Redis en prod).
- Servir landing/SPAs con contenedor Node 24/7.
- Servidor SMTP propio.
- SMTP desde Railway Hobby (está bloqueado); no subas a Pro solo por correo — usa SES API HTTPS.
- Subir a Pro de Railway solo por dominios: los frontends van en Cloudflare Workers (assets).

---

## 8. Referencias de código

| Tema | Ruta |
|------|------|
| Settings / `DATABASE_URL` | [`services/api/app/config.py`](../services/api/app/config.py) |
| CORS (`allow_origins=["*"]`) | [`services/api/app/main.py`](../services/api/app/main.py) |
| Landing Worker (assets) | [`apps/landing/wrangler.jsonc`](../apps/landing/wrangler.jsonc) |
| Dockerfile + arranque | [`services/api/Dockerfile`](../services/api/Dockerfile), [`services/api/railway.toml`](../services/api/railway.toml) |
| S3 presign | [`services/api/app/lib/storage/s3.py`](../services/api/app/lib/storage/s3.py) |
| Email (SMTP local / SES API) | [`services/api/app/services/email/transport.py`](../services/api/app/services/email/transport.py) |
| Env de ejemplo | [`.env.example`](../.env.example) |
