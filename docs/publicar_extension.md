# Publicar la extensión Vendelo360 (Chrome Web Store)

Guía operativa para la primera publicación y las actualizaciones siguientes. La extensión vive en [`apps/whatsapp-web`](../apps/whatsapp-web). Chrome **no** instala un `.crx` propio desde la web del seller ni auto-actualiza una carga «Load unpacked».

Flujo de los vendedores: la app seller (`/whatsapp`) abre la ficha de la tienda → el vendedor pulsa «Añadir a Chrome» → Chrome actualiza solo en segundo plano.

Visibilidad recomendada: **Unlisted** (solo quien tenga el enlace; no aparece en la búsqueda de la tienda). Una ficha privada por dominio de Google Workspace solo tendría sentido si todos los Chrome fueran de un Workspace vuestro.

---

## 1. Cuenta de desarrollador

1. Entra en el [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Acepta el acuerdo de desarrollador y paga la cuota única de registro (cuenta de Google).
3. Completa el perfil del publisher (nombre, contacto).

Sin esta cuenta no puedes subir el zip ni obtener un ID estable de la tienda.

---

## 2. Clave e ID estables

El ID de la extensión lo fija la clave privada del paquete. Para que Load unpacked (dev) y la ficha de la tienda compartan el mismo ID:

1. Genera un par de claves (una sola vez) y **guarda el `.pem` fuera del repo** (gestor de secretos / backup cifrado). No lo commits.

   ```bash
   openssl genrsa 2048 | openssl pkcs8 -topk8 -nocrypt -out vendelo360-extension.pem
   ```

2. Extrae la clave pública en el formato que espera el campo `key` del manifest (base64 de una línea). Herramientas habituales: [CRX Key Tool](https://github.com/pawliczka/crx-keytool) o el flujo de «Pack extension» en `chrome://extensions` (Chrome genera un `.pem` y un `.crx`; usa ese `.pem`).

3. Calcula el **extension ID** a partir de esa clave (32 caracteres hex). Debe coincidir con el ID que muestre la ficha tras la primera subida.

4. En el entorno de build (raíz del monorepo / CI):

   ```bash
   # Clave pública PEM (contenido del campo key; una línea o multilínea escapada)
   VITE_WHATSAPP_EXTENSION_KEY=...

   # Mismo ID en la app seller (página /whatsapp)
   VITE_WHATSAPP_EXTENSION_ID=abcdefghijklmnopqrstuvwxyzabcdef
   ```

   El build de la extensión lee `VITE_WHATSAPP_EXTENSION_KEY` y, si está definida, la escribe en `manifest.json` como `key`. Ver [`manifest.shared.ts`](../apps/whatsapp-web/manifest.shared.ts).

5. Añade `*.pem` a tu `.gitignore` local / secret store. El repo ya no debe contener la clave privada.

Hasta tener la cuenta y el ID, la página `/whatsapp` del seller muestra instrucciones y **no** el botón de la tienda (`VITE_WHATSAPP_EXTENSION_ID` vacío).

---

## 3. Build de producción

Desde la raíz del monorepo, con URLs reales:

```bash
export VITE_API_URL=https://api.vendelo360.app
export VITE_SELLER_URL=https://gestores.vendelo360.app
# opcional pero recomendado para ID estable en Load unpacked:
# export VITE_WHATSAPP_EXTENSION_KEY='...'

pnpm install
pnpm --filter @broker/whatsapp-web build
```

Salida: `apps/whatsapp-web/dist/` (`manifest.json`, `content.js`, `background.js`, `popup.html`, `icons/`, `fonts/`, …).

Comprueba que `dist/manifest.json` tenga:

- `host_permissions` con el origen del API de producción y `https://web.whatsapp.com/*`
- `externally_connectable.matches` con el origen del seller (`VITE_SELLER_URL`)
- `web_accessible_resources` con `icons/icon16.png` para ese origen (detección desde `/whatsapp`)

### Empaquetar el zip

El zip debe contener los **archivos de `dist/` en la raíz** (no la carpeta `dist` como único hijo):

```bash
cd apps/whatsapp-web/dist
zip -r ../vendelo360-extension.zip .
```

El `manifest.json` debe estar en la raíz del zip.

---

## 4. Primera ficha en la tienda

1. Dashboard → **New item** → sube `vendelo360-extension.zip`.
2. Completa la ficha:
   - **Name:** Vendelo360
   - **Summary / Description:** un solo propósito (ficha del cliente CRM en WhatsApp Web para vendedores autenticados).
   - **Visibility:** Unlisted
   - **Category:** Productivity (o la más cercana)
   - **Language:** Español
   - **Screenshots:** al menos una del sidebar en WhatsApp Web (tamaños que pida la consola)
   - **Icon:** usa los de `public/icons/`
3. **Single purpose** y justificación de permisos:
   - `storage`: sesión JWT del vendedor (no usa `localStorage` de WhatsApp).
   - Host `https://web.whatsapp.com/*`: content script / lectura de la UI del chat abierto.
   - Host del API (`https://api.…/*`): login y lookup de cliente/pedido.
4. **Privacy policy:** URL pública (landing o página legal) que explique que la extensión lee datos visibles del chat (nombre/teléfono cuando WhatsApp los muestra) y los envía a tu API solo con sesión de vendedor. Sin envío automático de mensajes ni scraping masivo.
5. **Distribution:** regiones que necesites.
6. Envía a **Submit for review**.

La primera revisión puede tardar días. Cuando esté aprobada:

1. Copia el **Item ID** (mismo que el extension ID).
2. Configura en el build / deploy del seller:

   ```bash
   VITE_WHATSAPP_EXTENSION_ID=<item-id>
   ```

3. La URL de instalación es:

   ```
   https://chromewebstore.google.com/detail/<item-id>
   ```

4. Redeploy de `apps/seller` para que `/whatsapp` muestre el botón «Instalar en Chrome».

---

## 5. Actualizaciones (mantenimiento)

Cada release:

1. Sube `version` en [`apps/whatsapp-web/manifest.shared.ts`](../apps/whatsapp-web/manifest.shared.ts) (semver; debe ser mayor que la publicada).
2. Build de producción y zip (sección 3).
3. En la misma ficha del Dashboard → **Package** → sube el zip nuevo → Submit.
4. Tras la revisión (suele ser más rápida que la primera), Chrome reparte la versión a los clientes en horas. El vendedor **no** abre `chrome://extensions`.

Comportamiento en el cliente:

- El service worker llama a `requestUpdateCheck` al despertar y escucha `onUpdateAvailable`.
- Si WhatsApp Web sigue abierto con el content script viejo, el sidebar muestra «Hay una versión nueva» → **Recargar** (recarga las pestañas de WhatsApp y aplica la extensión).
- Si el vendedor abre WhatsApp después del update, ya corre el código nuevo.

Load unpacked **no** recibe estas actualizaciones: solo sirve para desarrollo local (ver README de la extensión).

---

## 6. Checklist rápido

**Primera vez**

- [ ] Cuenta developer + pago
- [ ] `.pem` guardado fuera del repo; `VITE_WHATSAPP_EXTENSION_KEY` / ID documentados
- [ ] Build con `VITE_API_URL` y `VITE_SELLER_URL` de producción
- [ ] Zip con `manifest.json` en la raíz
- [ ] Ficha unlisted + política de privacidad + capturas
- [ ] Revisada y publicada
- [ ] `VITE_WHATSAPP_EXTENSION_ID` en el seller desplegado

**Cada update**

- [ ] `version` incrementada
- [ ] Build + zip
- [ ] Subida a la misma ficha
- [ ] Smoke test: instalar / actualizar en un Chrome limpio, login, abrir un chat 1:1

---

## Referencias

- [Chrome Web Store — Publish](https://developer.chrome.com/docs/webstore/publish)
- [Manifest V3](https://developer.chrome.com/docs/extensions/mv3/intro/)
- Desarrollo local: [`apps/whatsapp-web/README.md`](../apps/whatsapp-web/README.md)
- Deploy de portales: [`docs/deploy_railway.md`](./deploy_railway.md)
