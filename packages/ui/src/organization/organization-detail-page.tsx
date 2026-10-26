import {
  formatDateTime,
  getListOrganizationPlatformProductsOrganizationsOrganizationIdPlatformProductsGetQueryKey,
  OrganizationType,
  useAuth,
  useGetOrganizationOrganizationsOrganizationIdGet,
  useListOrganizationPlatformProductsOrganizationsOrganizationIdPlatformProductsGet,
  useReplaceOrganizationPlatformProductsOrganizationsOrganizationIdPlatformProductsPut,
  type OrganizationPlatformProductPublic,
  type OrganizationPublic,
  type PlatformProductCode,
} from '@broker/api'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Building2, Package } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { Navigate, useParams } from 'react-router-dom'

import { Badge } from '../components/ui/badge'
import { BtnConfirm } from '../components/btn-confirm'
import { BtnLink } from '../components/btn-link'
import { BtnList } from '../components/btn-list'
import { Button } from '../components/button'
import {
  DetailSection,
  type DetailSectionField,
} from '../components/detail-section'
import { PageLoading } from '../components/page-loading'
import { PageMessage } from '../components/page-message'
import { PageWrapper } from '../components/page-wrapper'
import { useAsyncAction } from '../crud/hooks/use-async-action'
import { notify } from '../lib/notify'
import { AddPlatformProduct } from './add-platform-product'

function organizationTypeLabel(type: OrganizationPublic['type']): string {
  return type === OrganizationType.provider ? 'Proveedor' : 'Gestor'
}

const organizationFields: DetailSectionField<OrganizationPublic>[] = [
  {
    title: 'Nombre',
    accessor: (org) => org.name,
  },
  {
    title: 'Tipo',
    accessor: (org) => organizationTypeLabel(org.type),
  },
  {
    title: 'Creada',
    accessor: (org) => org.created_at,
    format: (value) => formatDateTime(value as string),
  },
]

function enabledCodesFrom(
  products: OrganizationPlatformProductPublic[],
): PlatformProductCode[] {
  return products.filter((p) => p.enabled).map((p) => p.code)
}

export function OrganizationDetailPage() {
  const { organizationId = '' } = useParams<{ organizationId: string }>()
  const { user, isLoading: authLoading } = useAuth()
  const queryClient = useQueryClient()

  const orgQuery = useGetOrganizationOrganizationsOrganizationIdGet(organizationId, {
    query: { enabled: Boolean(organizationId) && Boolean(user?.is_super_admin) },
  })

  const productsQueryKey =
    getListOrganizationPlatformProductsOrganizationsOrganizationIdPlatformProductsGetQueryKey(
      organizationId,
    )

  const productsQuery =
    useListOrganizationPlatformProductsOrganizationsOrganizationIdPlatformProductsGet(
      organizationId,
      {
        query: {
          enabled: Boolean(organizationId) && Boolean(user?.is_super_admin),
        },
      },
    )

  const replaceMutation =
    useReplaceOrganizationPlatformProductsOrganizationsOrganizationIdPlatformProductsPut()

  const products = productsQuery.data ?? []
  const enabledCodes = useMemo(() => enabledCodesFrom(products), [products])
  const availableProducts = useMemo(
    () => products.filter((p) => !p.enabled),
    [products],
  )

  const replaceCodes = useCallback(
    async (codes: PlatformProductCode[]) => {
      await replaceMutation.mutateAsync({
        organizationId,
        data: { codes },
      })
      await queryClient.invalidateQueries({ queryKey: productsQueryKey })
      notify.updated('Acceso a productos', 'm')
    },
    [organizationId, productsQueryKey, queryClient, replaceMutation],
  )

  const grant = useAsyncAction(
    async (code: PlatformProductCode) => {
      if (enabledCodes.includes(code)) return
      await replaceCodes([...enabledCodes, code])
    },
    undefined,
    undefined,
    { error: true },
  )

  const revoke = useAsyncAction(
    async (code: PlatformProductCode) => {
      await replaceCodes(enabledCodes.filter((c) => c !== code))
    },
    undefined,
    undefined,
    { error: true },
  )

  const addProducts = useAsyncAction(
    async (codes: PlatformProductCode[]) => {
      const next = new Set([...enabledCodes, ...codes])
      await replaceCodes(Array.from(next))
    },
    undefined,
    undefined,
    { error: true },
  )

  if (authLoading) {
    return <PageLoading title="Cargando…" />
  }

  if (!user?.is_super_admin) {
    return <Navigate to="/" replace />
  }

  if (!organizationId || orgQuery.isLoading) {
    return <PageLoading title="Organización" />
  }

  if (orgQuery.isError || !orgQuery.data) {
    return (
      <PageMessage
        title="Organización no encontrada"
        message="No se pudo cargar la organización solicitada."
        icon={Building2}
        backTo="/organizations"
      />
    )
  }

  const organization = orgQuery.data
  const isMutating = grant.isPending || revoke.isPending || addProducts.isPending

  return (
    <PageWrapper
      title={organization.name}
      description="Detalle de la organización y acceso a productos de plataforma."
      icon={Building2}
      leading={
        <BtnLink
          to="/organizations"
          variant="outline"
          size="icon-sm"
          icon={ArrowLeft}
          aria-label="Volver a organizaciones"
        />
      }
      buttons={[
        <AddPlatformProduct
          key="add"
          availableProducts={availableProducts}
          onAdd={addProducts.run}
          isSubmitting={addProducts.isPending}
        />,
      ]}
    >
      <div className="space-y-6">
        <DetailSection
          title="Resumen"
          data={organization}
          fields={organizationFields}
        />

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" aria-hidden />
            <h2 className="font-headline text-sm font-semibold tracking-wide text-on-surface">
              Productos de plataforma
            </h2>
          </div>

          {productsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando productos…</p>
          ) : productsQuery.isError ? (
            <p className="text-sm text-destructive" role="alert">
              No se pudieron cargar los productos de plataforma.
            </p>
          ) : products.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay productos de plataforma en el catálogo.
            </p>
          ) : (
            <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/70 bg-surface-container-lowest">
              {products.map((product) => (
                <li
                  key={product.code}
                  className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-on-surface">{product.name}</p>
                      <Badge variant={product.enabled ? 'secondary' : 'outline'}>
                        {product.enabled ? 'Con acceso' : 'Sin acceso'}
                      </Badge>
                    </div>
                    {product.description ? (
                      <p className="text-sm text-muted-foreground">
                        {product.description}
                      </p>
                    ) : null}
                  </div>
                  <BtnList>
                    {product.enabled ? (
                      <BtnConfirm
                        size="sm"
                        variant="outline"
                        title="Quitar acceso"
                        description={`¿Quitar el acceso a «${product.name}» para esta organización?`}
                        confirmLabel="Quitar acceso"
                        confirmVariant="destructive"
                        isLoading={revoke.isPending}
                        disabled={isMutating && !revoke.isPending}
                        onConfirm={() => revoke.run(product.code)}
                      >
                        Quitar acceso
                      </BtnConfirm>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isMutating}
                        isLoading={grant.isPending}
                        onClick={() => void grant.run(product.code)}
                      >
                        Conceder acceso
                      </Button>
                    )}
                  </BtnList>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageWrapper>
  )
}
