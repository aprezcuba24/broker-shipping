import {
  getAdminListNeighborhoodsLocationsAdminNeighborhoodsGetQueryKey,
  useAdminCreateNeighborhoodLocationsAdminNeighborhoodsPost,
  useAdminDeleteNeighborhoodLocationsAdminNeighborhoodsNeighborhoodIdDelete,
  useAdminListNeighborhoodsLocationsAdminNeighborhoodsGet,
  useAdminPatchNeighborhoodLocationsAdminNeighborhoodsNeighborhoodIdPatch,
  type AdminListNeighborhoodsLocationsAdminNeighborhoodsGetParams,
  type NeighborhoodPublic,
  type PageNeighborhoodPublic,
} from '@broker/api'
import { MapPinHouse, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { Button } from '../../components/button'
import { DataTable } from '../../components/data-table/data-table'
import { PageWrapper } from '../../components/page-wrapper'
import { EntityFormDialog } from '../../crud/components/entity-form-dialog'
import { useCrudController } from '../../crud/hooks/use-crud-controller'
import { useCrudDialogs } from '../../crud/hooks/use-crud-dialogs'
import { useListParams } from '../../crud/hooks/use-list-params'
import { buildNeighborhoodColumns } from './columns'
import { NeighborhoodFilters } from './filters'
import {
  NeighborhoodForm,
  neighborhoodFormDefaultValues,
  type NeighborhoodFormValues,
} from './form'

const neighborhoodListFilterKeys = ['name', 'province_id', 'municipality_id'] as const

export function NeighborhoodAdminPage() {
  const dialogs = useCrudDialogs<NeighborhoodPublic>()
  const list = useListParams({
    filterKeys: neighborhoodListFilterKeys,
    defaultPageSize: 20,
  })

  const query = useAdminListNeighborhoodsLocationsAdminNeighborhoodsGet({
    page: list.queryParams.page,
    page_size: list.queryParams.page_size,
    name: list.queryParams.name || undefined,
    province_id: list.queryParams.province_id || undefined,
    municipality_id: list.queryParams.municipality_id || undefined,
  } as AdminListNeighborhoodsLocationsAdminNeighborhoodsGetParams)

  const createMutation = useAdminCreateNeighborhoodLocationsAdminNeighborhoodsPost()
  const patchMutation = useAdminPatchNeighborhoodLocationsAdminNeighborhoodsNeighborhoodIdPatch()
  const deleteMutation =
    useAdminDeleteNeighborhoodLocationsAdminNeighborhoodsNeighborhoodIdDelete()

  const crud = useCrudController<
    NeighborhoodPublic,
    NeighborhoodFormValues,
    PageNeighborhoodPublic,
    { data: { name: string; municipality_id: string } },
    { neighborhoodId: string; data: { name: string; municipality_id: string } },
    { neighborhoodId: string }
  >({
    list,
    dialogs,
    query,
    queryKey: getAdminListNeighborhoodsLocationsAdminNeighborhoodsGetQueryKey(),
    getItems: (data) => data?.items ?? [],
    getTotal: (data) => data?.total ?? 0,
    create: {
      mutation: createMutation,
      toVariables: (values) => ({
        data: {
          name: values.name,
          municipality_id: values.municipality_id,
        },
      }),
    },
    update: {
      mutation: patchMutation,
      toVariables: (item, values) => ({
        neighborhoodId: item.id,
        data: {
          name: values.name,
          municipality_id: values.municipality_id,
        },
      }),
    },
    remove: {
      mutation: deleteMutation,
      toVariables: (item) => ({ neighborhoodId: item.id }),
    },
    entityLabel: 'Barrio',
    entityGender: 'm',
  })

  const columns = useMemo(
    () =>
      buildNeighborhoodColumns({
        onEdit: dialogs.edit.open,
        onDelete: crud.remove.run,
        isDeleting: crud.remove.isPending,
      }),
    [crud.remove.isPending, crud.remove.run, dialogs.edit.open],
  )

  const editItem = dialogs.edit.item

  return (
    <PageWrapper
      title="Barrios"
      description="Catálogo de barrios del sistema."
      icon={MapPinHouse}
      buttons={[
        <Button
          key="create"
          size="sm"
          className="w-full sm:w-auto"
          icon={Plus}
          onClick={dialogs.create.open}
        >
          Nuevo barrio
        </Button>,
      ]}
    >
      <div className="space-y-4">
        <NeighborhoodFilters
          filters={list.filters}
          setFilter={list.setFilter}
          setFilters={list.setFilters}
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
        title="Nuevo barrio"
        Form={NeighborhoodForm}
        defaultValues={neighborhoodFormDefaultValues}
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
        title="Editar barrio"
        Form={NeighborhoodForm}
        defaultValues={
          editItem
            ? {
                name: editItem.name,
                municipality_id: editItem.municipality_id,
                province_id: editItem.province_id ?? '',
              }
            : neighborhoodFormDefaultValues
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
