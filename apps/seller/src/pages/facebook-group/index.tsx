import {
  getListFacebookGroupsFacebookGroupsGetQueryKey,
  useCreateFacebookGroupFacebookGroupsPost,
  useDeleteFacebookGroupFacebookGroupsGroupIdDelete,
  useListFacebookGroupsFacebookGroupsGet,
  usePatchFacebookGroupFacebookGroupsGroupIdPatch,
  type CreateFacebookGroupFacebookGroupsPostParams,
  type DeleteFacebookGroupFacebookGroupsGroupIdDeleteParams,
  type FacebookGroupPublic,
  type ListFacebookGroupsFacebookGroupsGetParams,
  type PageFacebookGroupPublic,
  type PatchFacebookGroupFacebookGroupsGroupIdPatchParams,
} from '@broker/api'
import {
  Button,
  DataTable,
  EntityFormDialog,
  PageWrapper,
  useActiveOrganization,
  useCrudController,
  useCrudDialogs,
  useListParams,
} from '@broker/ui'
import { Plus, Users } from 'lucide-react'
import { useMemo } from 'react'

import { buildFacebookGroupColumns } from './columns'
import { FacebookGroupFilters } from './filters'
import {
  FacebookGroupForm,
  facebookGroupFormDefaultValues,
  type FacebookGroupFormValues,
} from './form'

export function FacebookGroupPage() {
  const { activeOrganization } = useActiveOrganization()
  const dialogs = useCrudDialogs<FacebookGroupPublic>()
  const list = useListParams({
    filterKeys: ['name'] as const,
    defaultPageSize: 20,
  })

  const query = useListFacebookGroupsFacebookGroupsGet({
    page: list.queryParams.page,
    page_size: list.queryParams.page_size,
    name: list.queryParams.name || undefined,
  } as ListFacebookGroupsFacebookGroupsGetParams)

  const createMutation = useCreateFacebookGroupFacebookGroupsPost()
  const patchMutation = usePatchFacebookGroupFacebookGroupsGroupIdPatch()
  const deleteMutation = useDeleteFacebookGroupFacebookGroupsGroupIdDelete()

  const crud = useCrudController<
    FacebookGroupPublic,
    FacebookGroupFormValues,
    PageFacebookGroupPublic,
    {
      data: FacebookGroupFormValues
      params: CreateFacebookGroupFacebookGroupsPostParams
    },
    {
      groupId: string
      data: FacebookGroupFormValues
      params: PatchFacebookGroupFacebookGroupsGroupIdPatchParams
    },
    {
      groupId: string
      params: DeleteFacebookGroupFacebookGroupsGroupIdDeleteParams
    }
  >({
    list,
    dialogs,
    query,
    queryKey: getListFacebookGroupsFacebookGroupsGetQueryKey(),
    getItems: (data) => data?.items ?? [],
    getTotal: (data) => data?.total ?? 0,
    create: {
      mutation: createMutation,
      toVariables: (values) => ({
        data: values,
        params: {} as CreateFacebookGroupFacebookGroupsPostParams,
      }),
    },
    update: {
      mutation: patchMutation,
      toVariables: (item, values) => ({
        groupId: item.id,
        data: values,
        params: {} as PatchFacebookGroupFacebookGroupsGroupIdPatchParams,
      }),
    },
    remove: {
      mutation: deleteMutation,
      toVariables: (item) => ({
        groupId: item.id,
        params: {} as DeleteFacebookGroupFacebookGroupsGroupIdDeleteParams,
      }),
    },
    resetOn: [activeOrganization?.id],
    entityLabel: 'Grupo',
  })

  const columns = useMemo(
    () =>
      buildFacebookGroupColumns({
        onEdit: dialogs.edit.open,
        onDelete: crud.remove.run,
        isDeleting: crud.remove.isPending,
      }),
    [crud.remove.isPending, crud.remove.run, dialogs.edit.open],
  )

  const editItem = dialogs.edit.item

  return (
    <PageWrapper
      title="Grupos de Facebook"
      description="Grupos donde se publican los anuncios."
      icon={Users}
      buttons={[
        <Button
          key="create"
          size="sm"
          className="w-full sm:w-auto"
          icon={Plus}
          onClick={dialogs.create.open}
        >
          Nuevo grupo
        </Button>,
      ]}
    >
      <div className="space-y-4">
        <FacebookGroupFilters
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
          pagination={{
            page: list.page,
            pageSize: list.pageSize,
            total: crud.total,
            onPageChange: list.setPage,
          }}
        />
      </div>

      <EntityFormDialog
        title="Nuevo grupo"
        Form={FacebookGroupForm}
        defaultValues={facebookGroupFormDefaultValues}
        formKey={dialogs.create.formKey}
        open={dialogs.create.isOpen}
        onOpenChange={(open) => {
          dialogs.create.setOpen(open)
          if (!open) crud.create.clearError()
        }}
        onSubmit={crud.create.run}
        isSubmitting={crud.create.isPending}
        error={crud.create.error}
        acceptLabel="Crear"
      />

      <EntityFormDialog
        title="Editar grupo"
        Form={FacebookGroupForm}
        defaultValues={
          editItem
            ? { name: editItem.name, facebook_id: editItem.facebook_id }
            : facebookGroupFormDefaultValues
        }
        formKey={dialogs.edit.formKey ?? undefined}
        open={dialogs.edit.isOpen}
        onOpenChange={(open) => {
          dialogs.edit.setOpen(open)
          if (!open) crud.update.clearError()
        }}
        onSubmit={crud.update.run}
        isSubmitting={crud.update.isPending}
        error={crud.update.error}
        acceptLabel="Guardar"
      />
    </PageWrapper>
  )
}
