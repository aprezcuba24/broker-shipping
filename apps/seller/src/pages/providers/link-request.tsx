import {
  formatApiError,
  getListMySellerLinkRequestsOrganizationsSellerLinkRequestsMineGetQueryKey,
  useCreateSellerLinkRequestOrganizationsOrganizationIdSellerLinkRequestsPost,
  useListMySellerLinkRequestsOrganizationsSellerLinkRequestsMineGet,
} from '@broker/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageWrapper,
  ProviderLinkRequestForm,
  useActiveOrganization,
} from '@broker/ui'
import { useQueryClient } from '@tanstack/react-query'
import { Link2 } from 'lucide-react'
import { useState } from 'react'

export function ProviderLinkRequestPage() {
  const { activeOrganization } = useActiveOrganization()
  const queryClient = useQueryClient()
  const [success, setSuccess] = useState<string | null>(null)
  const createMutation =
    useCreateSellerLinkRequestOrganizationsOrganizationIdSellerLinkRequestsPost()
  const mineQuery = useListMySellerLinkRequestsOrganizationsSellerLinkRequestsMineGet()

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
            <ProviderLinkRequestForm
              isSubmitting={createMutation.isPending}
              successMessage={success}
              error={
                createMutation.isError
                  ? formatApiError(createMutation.error, 'No se pudo enviar la solicitud.')
                  : null
              }
              onSubmit={async ({ provider_organization_id }) => {
                setSuccess(null)
                createMutation.reset()
                await createMutation.mutateAsync({
                  organizationId: provider_organization_id,
                  params: { seller_organization_id: activeOrganization.id },
                })
                setSuccess('Solicitud enviada. El proveedor recibirá un correo.')
                await queryClient.invalidateQueries({
                  queryKey:
                    getListMySellerLinkRequestsOrganizationsSellerLinkRequestsMineGetQueryKey(),
                })
              }}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tus solicitudes pendientes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {mineQuery.isPending ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : (mineQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay solicitudes pendientes.</p>
          ) : (
            (mineQuery.data ?? []).map((inv) => (
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
