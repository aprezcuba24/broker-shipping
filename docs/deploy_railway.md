# Despliegue de menor costo: Railway + AWS + Cloudflare

Guía operativa para producción. Arquitectura:

| Pieza | Dónde | URL |
|-------|--------|-----|
| Landing (Astro) | Cloudflare Pages | `https://vendeya.app` (apex) |
| Portal proveedores | Cloudflare Pages | `https://proveedores.vendeya.app` |
| Portal gestores | Cloudflare Pages | `https://gestores.vendeya.app` |
| API FastAPI | Railway | `https://api.vendeya.app` |
| Postgres | Railway (plugin) | red privada |
| Imágenes | AWS S3 | `S3_PUBLIC_BASE_URL` |
| Envío de correo | AWS SES (SMTP) | — |
| Recepción de correo | Cloudflare Email Routing | `info@` / `hola@` → Gmail |

Dominio de referencia: **vendeya.app** (canónico en [`apps/landing`](../apps/landing)). Sustituye si usas otro.

---

## 1. Dominio y mapa DNS (Cloudflare)

### 1.1 Comprar / transferir el dominio

1. Entra en [Cloudflare Registrar](https://dash.cloudflare.com/) → **Domain Registration** (o añade el dominio y cambia nameservers).
2. Deja los **nameservers en Cloudflare** (necesario para CNAME flattening en el apex y Email Routing).
3. No uses Route 53 salvo que ya lo tengas: añade ~0.50 USD/zona + consultas.

### 1.2 Registros DNS

| Tipo | Nombre | Contenido / destino | Notas |
|------|--------|---------------------|--------|
| CNAME / apex | `@` | Target que da Cloudflare Pages (landing) | Cloudflare aplana el CNAME del apex |
| CNAME / redirect | `www` | Redirect 301 → `https://vendeya.app` | En Pages o regla Redirect Rules |
| CNAME | `proveedores` | Target Pages (proyecto backoffice) | Tras crear el custom domain en Pages |
| CNAME | `gestores` | Target Pages (proyecto seller) | Idem |
| CNAME | `api` | Target que da Railway (`xxx.up.railway.app`) | + TXT de verificación si Railway lo pide |
| CNAME ×3 | DKIM de SES | Valores de la consola SES | Easy DKIM |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:tu@email` | Endurecer a `p=quarantine` más adelante |
| MX + TXT | `mail` | Custom MAIL FROM de SES | Ver sección 5 |
| MX | `@` | Cloudflare Email Routing | Convive con Pages en el apex |

`admin.` se deja para más adelante.

El apex puede tener **CNAME/A de Pages y MX de Email Routing a la vez**: Pages no usa MX.

SSL: lo emiten Cloudflare Pages y Railway; no hace falta certificado comprado.

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

Copia / adapta (valores de ejemplo para `vendeya.app`):

```bash
# Postgres: referencia la DB de Railway (Variables → Add Reference)
# Opción A (recomendada): DATABASE_URL pública/privada del plugin Postgres
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Opción B: piezas sueltas (si no usas DATABASE_URL)
# POSTGRES_USER=
# POSTGRES_PASSWORD=
# POSTGRES_HOST=
# POSTGRES_PORT=5432
# POSTGRES_DB=

# SSL hacia Postgres (necesario en la URL pública de Railway)
POSTGRES_SSL=true

JWT_SECRET=<genera-al-menos-32-caracteres-aleatorios>
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# CORS: fijo en código a allow_origins=["*"] (backend multi-cliente; auth = JWT / API keys).
# No hace falta CORS_ORIGINS en Railway.

FRONTEND_BACKOFFICE_URL=https://proveedores.vendeya.app
FRONTEND_SELLER_URL=https://gestores.vendeya.app

SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=<ses-smtp-username>
SMTP_PASSWORD=<ses-smtp-password>
SMTP_USE_TLS=true
MAIL_FROM=noreply@vendeya.app
EMAIL_VERIFICATION_TOKEN_HOURS=24

AWS_ACCESS_KEY_ID=<iam>
AWS_SECRET_ACCESS_KEY=<iam>
AWS_REGION=us-east-1
# Dejar vacío en producción AWS (no MinIO):
AWS_ENDPOINT_URL=
S3_BUCKET=vendeya-prod
S3_PUBLIC_BASE_URL=https://vendeya-prod.s3.us-east-1.amazonaws.com
```

### 2.3 Dominio custom de la API

En el servicio API → **Settings → Networking → Custom Domain** → `api.vendeya.app`. Añade el CNAME (+ TXT) que indique Railway.

Hobby: máximo **2 dominios custom por servicio**; con solo `api.` basta.

### 2.4 Post-deploy

```bash
# Super-admin (ejecutar una vez vía Railway shell / one-off)
uv run python scripts/create_super_admin.py
```

Comprueba `https://api.vendeya.app/docs` y `GET /`.

**No** despliegues Redis ni MinIO en Railway.

---

## 3. Cloudflare Pages: tres sitios

Tres proyectos Pages, mismo monorepo. Build desde la **raíz** del repo (pnpm workspaces).

| Proyecto Pages | Filtro | Build command | Output dir | Custom domain |
|----------------|--------|---------------|------------|---------------|
| `vendeya-landing` | `@broker/landing` | ver abajo | `apps/landing/dist` | `vendeya.app` + `www` → apex |
| `vendeya-proveedores` | `@broker/backoffice` | ver abajo | `apps/backoffice/dist` | `proveedores.vendeya.app` |
| `vendeya-gestores` | `@broker/seller` | ver abajo | `apps/seller/dist` | `gestores.vendeya.app` |

### 3.1 Ajustes comunes de build

- **Framework preset:** None (o Astro solo en landing).
- **Root directory:** `/` (raíz del monorepo).
- **Node:** 20+.
- **Install:** `pnpm install` (activa Corepack o instala pnpm en el build).

Ejemplo de **Build command** (landing):

```bash
pnpm install && pnpm --filter @broker/landing build
```

Proveedores:

```bash
pnpm install && pnpm --filter @broker/backoffice build
```

Gestores:

```bash
pnpm install && pnpm --filter @broker/seller build
```

### 3.2 Variables de build

| Proyecto | Variable | Valor |
|----------|----------|--------|
| Landing | `PUBLIC_SITE_URL` | `https://vendeya.app` |
| Proveedores | `VITE_API_URL` | `https://api.vendeya.app` |
| Proveedores | `VITE_SELLER_APP_URL` | `https://gestores.vendeya.app` |
| Gestores | `VITE_API_URL` | `https://api.vendeya.app` |

### 3.3 SPA fallback (React Router)

Los portales incluyen `public/_redirects` (Cloudflare Pages):

```
/*    /index.html   200
```

La landing Astro es HTML estático; no necesita ese fallback.

### 3.4 Orden de publicación

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

Usuario (o rol) con política mínima sobre ese bucket:

- `s3:PutObject`
- `s3:GetObject`
- `s3:DeleteObject`
- `s3:ListBucket` (opcional)

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

### 5.1 Envío (SES SMTP)

1. Consola AWS → **Amazon SES** → misma región (`us-east-1`).
2. **Identities → Create → Domain** → `vendeya.app`.
3. Publica en Cloudflare los CNAME de **Easy DKIM**.
4. **Custom MAIL FROM:** `mail.vendeya.app` → añade MX + TXT SPF que indique SES.
5. TXT `_dmarc` en el apex (ver mapa DNS).
6. **SMTP settings** → Create SMTP credentials → guarda usuario/clave.
7. En Railway:

```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USER=...
SMTP_PASSWORD=...
MAIL_FROM=noreply@vendeya.app
```

8. **Salida del sandbox:** SES → Account dashboard → Request production access. AWS pide sitio público (la landing en el apex sirve), política de uso y tipo de correo (transaccional: verificación, invitaciones).

Hasta salir del sandbox solo puedes enviar a direcciones verificadas.

### 5.2 Recepción (Cloudflare Email Routing)

1. Cloudflare → dominio → **Email → Email Routing** → Enable.
2. Destino: tu Gmail (o similar).
3. Direcciones: `info@vendeya.app`, `hola@vendeya.app` (y las que necesites).
4. No configures un buzón IMAP de pago hasta que haga falta.

Convive con Pages en el apex (MX + CNAME flattening).

### 5.3 Checklist correo

- [ ] Dominio verificado en SES + DKIM
- [ ] Custom MAIL FROM `mail.`
- [ ] DMARC básico
- [ ] Credenciales SMTP en Railway
- [ ] Production access (o emails de prueba verificados)
- [ ] Email Routing `info@` / `hola@`

---

## 6. Coste orientativo

| Pieza | Coste |
|-------|--------|
| Dominio (Cloudflare Registrar) | ~10–12 USD/año |
| Pages + DNS + Email Routing | 0 |
| Railway Hobby (API + Postgres) | ~5–15 USD/mes |
| S3 | céntimos al inicio |
| SES | ~0.10 USD / 1000 emails |

---

## 7. Qué no hacer

- Postgres en RDS/EC2 solo “porque está en AWS”.
- MinIO o Redis en Railway (la API aún no usa Redis en prod).
- Servir landing/SPAs con contenedor Node 24/7.
- Servidor SMTP propio.
- Subir a Pro de Railway solo por dominios (Pages cubre los sitios).

---

## 8. Referencias de código

| Tema | Ruta |
|------|------|
| Settings / `DATABASE_URL` | [`services/api/app/config.py`](../services/api/app/config.py) |
| CORS (`allow_origins=["*"]`) | [`services/api/app/main.py`](../services/api/app/main.py) |
| Dockerfile + arranque | [`services/api/Dockerfile`](../services/api/Dockerfile), [`services/api/railway.toml`](../services/api/railway.toml) |
| S3 presign | [`services/api/app/lib/storage/s3.py`](../services/api/app/lib/storage/s3.py) |
| SMTP | [`services/api/app/services/email/transport.py`](../services/api/app/services/email/transport.py) |
| Env de ejemplo | [`.env.example`](../.env.example) |
