import {
  getListLinkedSellersOrganizationsProviderOrganizationIdLinkedSellersGetQueryKey,
  getListOrganizationInvitationsOrganizationsProviderOrganizationIdInvitationsGetQueryKey,
} from '@broker/api'
import {
  DataTable,
  PageWrapper,
  SellerLinkRequestsList,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useActiveOrganization,
  useResetOnChange,
} from '@broker/ui'
import { Store } from 'lucide-react'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { useInvitationsSettings } from '@/hooks/use-invitations-settings'
import { useLinkedSellers } from '@/hooks/use-linked-sellers'

import { buildLinkedSellerColumns } from './columns'

type SellersTab = 'linked' | 'pending'

function resolveTab(value: string | null): SellersTab {
  return value === 'pending' ? 'pending' : 'linked'
}

export function SellersPage() {
  const { activeOrganization } = useActiveOrganization()
  const orgId = activeOrganization?.id ?? ''
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = resolveTab(searchParams.get('tab'))

  const {
    sellers,
    isLoading: sellersLoading,
    unlink,
    isUnlinking,
    unlinkingSellerId,
  } = useLinkedSellers()
  const { hasActiveOrg, sellerLinkRequestsProps } = useInvitationsSettings()

  useResetOnChange({
    resetOnChange: [orgId],
    getQueryKey: () =>
      getListLinkedSellersOrganizationsProviderOrganizationIdLinkedSellersGetQueryKey(orgId),
  })

  useResetOnChange({
    resetOnChange: [orgId],
    getQueryKey: () =>
      getListOrganizationInvitationsOrganizationsProviderOrganizationIdInvitationsGetQueryKey(
        orgId,
      ),
  })

  const columns = useMemo(
    () =>
      buildLinkedSellerColumns({
        onUnlink: unlink,
        isUnlinking,
        unlinkingSellerId,
      }),
    [isUnlinking, unlink, unlinkingSellerId],
  )

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

  if (!hasActiveOrg) {
    return (
      <PageWrapper title="Organizaciones vendedoras" description="Selecciona una organización.">
        <p className="text-sm text-muted-foreground">No hay organización activa.</p>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper
      title="Organizaciones vendedoras"
      description="Gestiona las organizaciones vendedoras vinculadas y las solicitudes pendientes."
      icon={Store}
    >
      <Tabs value={activeTab} onValueChange={setTab} className="space-y-4">
        <TabsList variant="line">
          <TabsTrigger value="linked">Vinculados</TabsTrigger>
          <TabsTrigger value="pending">Pendientes</TabsTrigger>
        </TabsList>

        <TabsContent value="linked" className="space-y-4">
          <DataTable
            columns={columns}
            data={sellers}
            isLoading={sellersLoading}
            getRowId={(row) => row.id}
            emptyMessage="No tienes organizaciones vendedoras vinculadas."
          />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <SellerLinkRequestsList {...sellerLinkRequestsProps} />
        </TabsContent>
      </Tabs>
    </PageWrapper>
  )
}
