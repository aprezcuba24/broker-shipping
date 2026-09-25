import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageWrapper,
} from '@broker/ui'
import {
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  RefreshCw,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

type ExtensionStatus = 'checking' | 'installed' | 'missing' | 'unconfigured'

const EXTENSION_ID = import.meta.env.VITE_WHATSAPP_EXTENSION_ID?.trim() || ''

function storeUrl(extensionId: string): string {
  return `https://chromewebstore.google.com/detail/${extensionId}`
}

function probeExtensionInstalled(extensionId: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    const timer = window.setTimeout(() => {
      img.onload = null
      img.onerror = null
      resolve(false)
    }, 2_000)

    img.onload = () => {
      window.clearTimeout(timer)
      resolve(true)
    }
    img.onerror = () => {
      window.clearTimeout(timer)
      resolve(false)
    }
    img.src = `chrome-extension://${extensionId}/icons/icon16.png?t=${Date.now()}`
  })
}

export function WhatsAppExtensionPage() {
  const [status, setStatus] = useState<ExtensionStatus>(() =>
    EXTENSION_ID ? 'checking' : 'unconfigured',
  )

  const refresh = useCallback(async () => {
    if (!EXTENSION_ID) {
      setStatus('unconfigured')
      return
    }
    setStatus('checking')
    const installed = await probeExtensionInstalled(EXTENSION_ID)
    setStatus(installed ? 'installed' : 'missing')
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refresh])

  return (
    <PageWrapper
      title="WhatsApp"
      description="Instala la extensión Vendelo360 para ver la ficha del cliente en WhatsApp Web."
      icon={MessageCircle}
      buttons={[
        <Button
          key="refresh"
          type="button"
          variant="outline"
          size="sm"
          icon={RefreshCw}
          label="Comprobar de nuevo"
          onClick={() => void refresh()}
          disabled={status === 'checking' || status === 'unconfigured'}
        />,
      ]}
    >
      <div className="mx-auto max-w-2xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estado</CardTitle>
            <CardDescription>
              {status === 'checking'
                ? 'Comprobando si la extensión está instalada en este navegador…'
                : status === 'installed'
                  ? 'La extensión está instalada y lista para usarse.'
                  : status === 'missing'
                    ? 'Aún no detectamos la extensión en este Chrome.'
                    : 'La ficha de la Chrome Web Store aún no está configurada en este entorno.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'installed' ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="size-5 text-emerald-600" aria-hidden />
                  Lista
                </p>
                <Button asChild>
                  <a
                    href="https://web.whatsapp.com"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink aria-hidden />
                    Abrir WhatsApp Web
                  </a>
                </Button>
              </div>
            ) : null}

            {status === 'missing' && EXTENSION_ID ? (
              <div className="space-y-3">
                <Button asChild>
                  <a
                    href={storeUrl(EXTENSION_ID)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink aria-hidden />
                    Instalar en Chrome
                  </a>
                </Button>
                <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                  <li>Pulsa «Añadir a Chrome» en la ficha de la tienda.</li>
                  <li>Abre o recarga WhatsApp Web.</li>
                  <li>
                    Inicia sesión con tu cuenta de vendedor en el icono Vendelo360
                    de la barra de extensiones.
                  </li>
                </ol>
              </div>
            ) : null}

            {status === 'unconfigured' ? (
              <p className="text-sm text-muted-foreground">
                Cuando la extensión esté publicada, configura{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  VITE_WHATSAPP_EXTENSION_ID
                </code>{' '}
                (ver{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  docs/publicar_extension.md
                </code>
                ). Mientras tanto puedes cargar el build local desde{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  chrome://extensions
                </code>
                .
              </p>
            ) : null}

            {status === 'checking' ? (
              <p className="text-sm text-muted-foreground">Comprobando…</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  )
}
