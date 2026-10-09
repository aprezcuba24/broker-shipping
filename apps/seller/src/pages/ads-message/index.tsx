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
  Button,
  DataTable,
  PageWrapper,
  useActiveOrganization,
  useCrudController,
  useListParams,
} from '@broker/ui'
import { ArrowRight, Megaphone, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  getSelectedMessageCount,
  useFacebookPublishStore,
} from '../../stores/facebook-publish-store'
import { buildAdsMessageColumns } from './columns'
import { AdsMessageFilters } from './filters'
import type { AdsMessageFormValues } from './form'

export function AdsMessagePage() {
  const navigate = useNavigate()
  const { activeOrganization } = useActiveOrganization()
  const messages = useFacebookPublishStore((state) => state.messages)
  const toggleMessage = useFacebookPublishStore((state) => state.toggleMessage)
  const selectedCount = getSelectedMessageCount(messages)
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
        isSelected: (row) => messages[row.id] != null,
        onSelectChange: (row) =>
          toggleMessage({
            id: row.id,
            title: row.title,
            description: row.description,
            code: row.code,
            photo_url: row.photo_url ?? null,
          }),
      }),
    [crud.remove.isPending, crud.remove.run, messages, toggleMessage],
  )

  return (
    <PageWrapper
      title="Anuncios de Facebook"
      description="Mensajes listos para publicar en grupos."
      icon={Megaphone}
      buttons={[
        <Button
          key="next"
          icon={ArrowRight}
          label={`Siguiente (${selectedCount})`}
          disabled={selectedCount === 0}
          onClick={() => navigate('/ads-messages/publish')}
        />,
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
export { AdsMessagePublishGroupsPage } from './publish-groups-page'
