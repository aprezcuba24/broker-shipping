import {
  getListTagsTagsProviderGetQueryKey,
  useCreateTagTagsProviderPost,
  useDeleteTagTagsProviderTagIdDelete,
  useListTagsTagsProviderGet,
  usePatchTagTagsProviderTagIdPatch,
  type CreateTagTagsProviderPostParams,
  type DeleteTagTagsProviderTagIdDeleteParams,
  type ListTagsTagsProviderGetParams,
  type PageTagPublic,
  type PatchTagTagsProviderTagIdPatchParams,
  type TagPublic,
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
import { Plus, Tag } from 'lucide-react'
import { useMemo } from 'react'

import { buildTagColumns } from './columns'
import { TagFilters } from './filters'
import { TagForm, tagFormDefaultValues, type TagFormValues } from './form'

const tagListFilterKeys = ['name', 'is_active'] as const

function parseIsActiveFilter(value: string | undefined): boolean | undefined {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

export function TagPage() {
  const { activeOrganization } = useActiveOrganization()
  const dialogs = useCrudDialogs<TagPublic>()
  const list = useListParams({
    filterKeys: tagListFilterKeys,
    defaultPageSize: 20,
  })

  const query = useListTagsTagsProviderGet({
    page: list.queryParams.page,
    page_size: list.queryParams.page_size,
    name: list.queryParams.name || undefined,
    is_active: parseIsActiveFilter(list.queryParams.is_active),
  } as ListTagsTagsProviderGetParams)

  const createMutation = useCreateTagTagsProviderPost()
  const patchMutation = usePatchTagTagsProviderTagIdPatch()
  const deleteMutation = useDeleteTagTagsProviderTagIdDelete()

  const crud = useCrudController<
    TagPublic,
    TagFormValues,
    PageTagPublic,
    {
      data: TagFormValues
      params: CreateTagTagsProviderPostParams
    },
    {
      tagId: string
      data: TagFormValues
      params: PatchTagTagsProviderTagIdPatchParams
    },
    {
      tagId: string
      params: DeleteTagTagsProviderTagIdDeleteParams
    }
  >({
    list,
    dialogs,
    query,
    queryKey: getListTagsTagsProviderGetQueryKey(),
    getItems: (data) => data?.items ?? [],
    getTotal: (data) => data?.total ?? 0,
    create: {
      mutation: createMutation,
      toVariables: (values) => ({
        data: values,
        params: {} as CreateTagTagsProviderPostParams,
      }),
    },
    update: {
      mutation: patchMutation,
      toVariables: (item, values) => ({
        tagId: item.id,
        data: values,
        params: {} as PatchTagTagsProviderTagIdPatchParams,
      }),
    },
    remove: {
      mutation: deleteMutation,
      toVariables: (item) => ({
        tagId: item.id,
        params: {} as DeleteTagTagsProviderTagIdDeleteParams,
      }),
    },
    resetOn: [activeOrganization?.id],
  })

  const columns = useMemo(
    () =>
      buildTagColumns({
        onEdit: dialogs.edit.open,
        onDelete: crud.remove.run,
        isDeleting: crud.remove.isPending,
      }),
    [crud.remove.isPending, crud.remove.run, dialogs.edit.open],
  )

  const editItem = dialogs.edit.item

  return (
    <PageWrapper
      title="Etiquetas"
      description="Gestiona las etiquetas del catálogo de tu organización."
      icon={Tag}
      buttons={[
        <Button
          key="create"
          size="sm"
          className="w-full sm:w-auto"
          icon={Plus}
          onClick={dialogs.create.open}
        >
          Nueva etiqueta
        </Button>,
      ]}
    >
      <div className="space-y-4">
        <TagFilters
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
          emptyMessage="No hay etiquetas registradas"
          pagination={{
            page: list.page,
            pageSize: list.pageSize,
            total: crud.total,
            onPageChange: list.setPage,
          }}
        />
      </div>

      <EntityFormDialog
        title="Nueva etiqueta"
        Form={TagForm}
        defaultValues={tagFormDefaultValues}
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
        title="Editar etiqueta"
        Form={TagForm}
        defaultValues={
          editItem
            ? { name: editItem.name, is_active: editItem.is_active }
            : tagFormDefaultValues
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
