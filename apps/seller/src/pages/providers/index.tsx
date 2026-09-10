import {
  getListMySellerLinkRequestsOrganizationsSellerSellerLinkRequestsMineGetQueryKey,
  getListProvidersOrganizationsSellerProvidersGetQueryKey,
  useListMySellerLinkRequestsOrganizationsSellerSellerLinkRequestsMineGet,
} from '@broker/api'
import {
  DataTable,
  PageWrapper,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useActiveOrganization,
  useResetOnChange,
} from '@broker/ui'
import { Truck } from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useLinkedProviders } from '@/hooks/use-linked-providers'

import { buildLinkedProviderColumns, buildPendingRequestColumns } from './columns'

type ProvidersTab = 'linked' | 'pending'

function resolveTab(value: string | null): ProvidersTab {
  return value === 'pending' ? 'pending' : 'linked'
}

export function ProvidersPage() {
  const { activeOrganization } = useActiveOrganization()
  const activeOrgId = activeOrganization?.id
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = resolveTab(searchParams.get('tab'))

  const { providers, isLoading: providersLoading } = useLinkedProviders()

  const requestsQuery =
    useListMySellerLinkRequestsOrganizationsSellerSellerLinkRequestsMineGet()

  useResetOnChange({
    resetOnChange: [activeOrgId],
    getQueryKey: () => getListProvidersOrganizationsSellerProvidersGetQueryKey(),
  })

  useResetOnChange({
    resetOnChange: [activeOrgId],
    getQueryKey: () =>
      getListMySellerLinkRequestsOrganizationsSellerSellerLinkRequestsMineGetQueryKey(),
  })

  const pendingRequests = useMemo(() => {
    const all = requestsQuery.data ?? []
    if (!activeOrgId) return []
    return all.filter((inv) => inv.counterparty_organization_id === activeOrgId)
  }, [requestsQuery.data, activeOrgId])

  const linkedColumns = useMemo(() => buildLinkedProviderColumns(), [])
  const pendingColumns = useMemo(() => buildPendingRequestColumns(), [])

  const setTab = (value: string) => {
    const tab = resolveTab(value)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (tab === 'linked') {
          next.delete('tab')
        } else {
          next.set('tab', tab)
        }
        return next
      },
      { replace: true },
    )
  }

  return (
    <PageWrapper
      title="Proveedores"
      description="Proveedores vinculados a tu organización y solicitudes pendientes de aprobación."
      icon={Truck}
    >
      <Tabs value={activeTab} onValueChange={setTab} className="space-y-4">
        <TabsList variant="line">
          <TabsTrigger value="linked">Vinculados</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
        </TabsList>

        <TabsContent value="linked" className="space-y-4">
          <DataTable
            columns={linkedColumns}
            data={providers}
            isLoading={providersLoading}
            getRowId={(row) => row.id}
            emptyMessage="No tienes proveedores vinculados."
          />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <DataTable
            columns={pendingColumns}
            data={pendingRequests}
            isLoading={requestsQuery.isLoading}
            getRowId={(row) => row.id}
            emptyMessage="No hay solicitudes pendientes de aprobación."
          />
        </TabsContent>
      </Tabs>
    </PageWrapper>
  )
}
