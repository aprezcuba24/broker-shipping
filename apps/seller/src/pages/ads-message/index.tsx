import {
  getListAdsMessagesFacebookAdsMessagesGetQueryKey,
  useDeleteAdsMessageFacebookAdsMessagesAdsMessageIdDelete,
  useListAdsMessagesFacebookAdsMessagesGet,
  type AdsMessagePublic,
  type DeleteAdsMessageFacebookAdsMessagesAdsMessageIdDeleteParams,
  type ListAdsMessagesFacebookAdsMessagesGetParams,
  type PageAdsMessagePublic,
} from '@broker/api'
import {
  BtnLink,
  DataTable,
  PageWrapper,
  useActiveOrganization,
  useCrudController,
  useListParams,
} from '@broker/ui'
import { Megaphone, Plus } from 'lucide-react'
import { useMemo } from 'react'

import { buildAdsMessageColumns } from './columns'
import { AdsMessageFilters } from './filters'
import type { AdsMessageFormValues } from './form'

export function AdsMessagePage() {
  const { activeOrganization } = useActiveOrganization()
  const list = useListParams({
    filterKeys: ['title'] as const,
    defaultPageSize: 20,
  })

  const query = useListAdsMessagesFacebookAdsMessagesGet({
    page: list.queryParams.page,
    page_size: list.queryParams.page_size,
    title: list.queryParams.title || undefined,
  } as ListAdsMessagesFacebookAdsMessagesGetParams)

  const deleteMutation = useDeleteAdsMessageFacebookAdsMessagesAdsMessageIdDelete()

  const crud = useCrudController<
    AdsMessagePublic,
    AdsMessageFormValues,
    PageAdsMessagePublic,
    never,
    never,
    {
      adsMessageId: string
      params: DeleteAdsMessageFacebookAdsMessagesAdsMessageIdDeleteParams
    }
  >({
    list,
    query,
    queryKey: getListAdsMessagesFacebookAdsMessagesGetQueryKey(),
    getItems: (data) => data?.items ?? [],
    getTotal: (data) => data?.total ?? 0,
    remove: {
      mutation: deleteMutation,
      toVariables: (item) => ({
        adsMessageId: item.id,
        params: {} as DeleteAdsMessageFacebookAdsMessagesAdsMessageIdDeleteParams,
      }),
    },
    resetOn: [activeOrganization?.id],
    entityLabel: 'Anuncio',
  })

  const columns = useMemo(
    () =>
      buildAdsMessageColumns({
        onDelete: crud.remove.run,
        isDeleting: crud.remove.isPending,
      }),
    [crud.remove.isPending, crud.remove.run],
  )

  return (
    <PageWrapper
      title="Anuncios de Facebook"
      description="Mensajes listos para publicar en grupos."
      icon={Megaphone}
      buttons={[
        <BtnLink key="create" to="/ads-messages/new" icon={Plus}>
          Nuevo anuncio
        </BtnLink>,
      ]}
    >
      <div className="space-y-4">
        <AdsMessageFilters
          filters={list.filters}
          setFilter={list.setFilter}
          onClear={list.resetFilters}
          hasActiveFilters={list.hasActiveFilters}
        />

        <DataTable
          columns={columns}
          data={crud.items}
          isLoading={crud.isLoading}
          getRowId={(row) => row.id}
          views={['rows', 'cards']}
          pagination={{
            page: list.page,
            pageSize: list.pageSize,
            total: crud.total,
            onPageChange: list.setPage,
          }}
        />
      </div>
    </PageWrapper>
  )
}

export { AdsMessageCreatePage } from './create-page'
export { AdsMessageEditPage } from './edit-page'
