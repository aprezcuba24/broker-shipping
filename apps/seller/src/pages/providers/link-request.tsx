import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageWrapper,
  ProviderLinkRequestForm,
} from '@broker/ui'
import { Link2 } from 'lucide-react'
import { useProviderLinkRequest } from '@/hooks/use-provider-link-request'

export function ProviderLinkRequestPage() {
  const {
    activeOrganization,
    createFormProps,
    requests,
    isLoadingRequests,
  } = useProviderLinkRequest()

  return (
    <PageWrapper
      title="Enlace con proveedores"
      description="Solicita enlazarte con una organización proveedora."
      icon={Link2}
    >
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Solicitar enlace</CardTitle>
          <CardDescription>
            Introduce el ID de la organización proveedora. Sus miembros recibirán un correo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!activeOrganization ? (
            <p className="text-sm text-muted-foreground">Selecciona una organización vendedora.</p>
          ) : (
            <ProviderLinkRequestForm {...createFormProps} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tus solicitudes pendientes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoadingRequests ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay solicitudes pendientes.</p>
          ) : (
            requests.map((inv) => (
              <div
                key={inv.id}
                className="rounded-md border border-border px-3 py-2 text-sm"
              >
                <div className="font-medium">Proveedor</div>
                <div className="font-mono text-xs text-muted-foreground">{inv.organization_id}</div>
                <div className="text-xs text-muted-foreground mt-1">Estado: {inv.status}</div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  )
}
