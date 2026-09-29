import {
  getAdminListProvincesLocationsAdminProvincesGetQueryKey,
  useAdminCreateProvinceLocationsAdminProvincesPost,
  useAdminDeleteProvinceLocationsAdminProvincesProvinceIdDelete,
  useAdminListProvincesLocationsAdminProvincesGet,
  useAdminPatchProvinceLocationsAdminProvincesProvinceIdPatch,
  type AdminListProvincesLocationsAdminProvincesGetParams,
  type PageProvincePublic,
  type ProvincePublic,
} from '@broker/api'
import { Map, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { Button } from '../../components/button'
import { DataTable } from '../../components/data-table/data-table'
import { PageWrapper } from '../../components/page-wrapper'
import { EntityFormDialog } from '../../crud/components/entity-form-dialog'
import { useCrudController } from '../../crud/hooks/use-crud-controller'
import { useCrudDialogs } from '../../crud/hooks/use-crud-dialogs'
import { useListParams } from '../../crud/hooks/use-list-params'
import { buildProvinceColumns } from './columns'
import { ProvinceFilters } from './filters'
import { ProvinceForm, provinceFormDefaultValues, type ProvinceFormValues } from './form'

const provinceListFilterKeys = ['name'] as const

export function ProvinceAdminPage() {
  const dialogs = useCrudDialogs<ProvincePublic>()
  const list = useListParams({
    filterKeys: provinceListFilterKeys,
    defaultPageSize: 20,
  })

  const query = useAdminListProvincesLocationsAdminProvincesGet({
    page: list.queryParams.page,
    page_size: list.queryParams.page_size,
    name: list.queryParams.name || undefined,
  } as AdminListProvincesLocationsAdminProvincesGetParams)

  const createMutation = useAdminCreateProvinceLocationsAdminProvincesPost()
  const patchMutation = useAdminPatchProvinceLocationsAdminProvincesProvinceIdPatch()
  const deleteMutation = useAdminDeleteProvinceLocationsAdminProvincesProvinceIdDelete()

  const crud = useCrudController<
    ProvincePublic,
    ProvinceFormValues,
    PageProvincePublic,
    { data: ProvinceFormValues },
    { provinceId: string; data: ProvinceFormValues },
    { provinceId: string }
  >({
    list,
    dialogs,
    query,
    queryKey: getAdminListProvincesLocationsAdminProvincesGetQueryKey(),
    getItems: (data) => data?.items ?? [],
    getTotal: (data) => data?.total ?? 0,
    create: {
      mutation: createMutation,
      toVariables: (values) => ({ data: values }),
    },
    update: {
      mutation: patchMutation,
      toVariables: (item, values) => ({
        provinceId: item.id,
        data: values,
      }),
    },
    remove: {
      mutation: deleteMutation,
      toVariables: (item) => ({ provinceId: item.id }),
    },
    entityLabel: 'Provincia',
    entityGender: 'f',
  })

  const columns = useMemo(
    () =>
      buildProvinceColumns({
        onEdit: dialogs.edit.open,
        onDelete: crud.remove.run,
        isDeleting: crud.remove.isPending,
      }),
    [crud.remove.isPending, crud.remove.run, dialogs.edit.open],
  )

  const editItem = dialogs.edit.item

  return (
    <PageWrapper
      title="Provincias"
      description="Catálogo de provincias del sistema."
      icon={Map}
      buttons={[
        <Button
          key="create"
          size="sm"
          className="w-full sm:w-auto"
          icon={Plus}
          onClick={dialogs.create.open}
        >
          Nueva provincia
        </Button>,
      ]}
    >
      <div className="space-y-4">
        <ProvinceFilters
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
        title="Nueva provincia"
        Form={ProvinceForm}
        defaultValues={provinceFormDefaultValues}
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
        title="Editar provincia"
        Form={ProvinceForm}
        defaultValues={editItem ? { name: editItem.name } : provinceFormDefaultValues}
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
