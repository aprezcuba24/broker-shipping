import {
  getAdminListMunicipalitiesLocationsAdminMunicipalitiesGetQueryKey,
  useAdminCreateMunicipalityLocationsAdminMunicipalitiesPost,
  useAdminDeleteMunicipalityLocationsAdminMunicipalitiesMunicipalityIdDelete,
  useAdminListMunicipalitiesLocationsAdminMunicipalitiesGet,
  useAdminPatchMunicipalityLocationsAdminMunicipalitiesMunicipalityIdPatch,
  type AdminListMunicipalitiesLocationsAdminMunicipalitiesGetParams,
  type MunicipalityPublic,
  type PageMunicipalityPublic,
} from '@broker/api'
import { MapPinned, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { Button } from '../../components/button'
import { DataTable } from '../../components/data-table/data-table'
import { PageWrapper } from '../../components/page-wrapper'
import { EntityFormDialog } from '../../crud/components/entity-form-dialog'
import { useCrudController } from '../../crud/hooks/use-crud-controller'
import { useCrudDialogs } from '../../crud/hooks/use-crud-dialogs'
import { useListParams } from '../../crud/hooks/use-list-params'
import { buildMunicipalityColumns } from './columns'
import { MunicipalityFilters } from './filters'
import {
  MunicipalityForm,
  municipalityFormDefaultValues,
  type MunicipalityFormValues,
} from './form'

const municipalityListFilterKeys = ['name', 'province_id'] as const

export function MunicipalityAdminPage() {
  const dialogs = useCrudDialogs<MunicipalityPublic>()
  const list = useListParams({
    filterKeys: municipalityListFilterKeys,
    defaultPageSize: 20,
  })

  const query = useAdminListMunicipalitiesLocationsAdminMunicipalitiesGet({
    page: list.queryParams.page,
    page_size: list.queryParams.page_size,
    name: list.queryParams.name || undefined,
    province_id: list.queryParams.province_id || undefined,
  } as AdminListMunicipalitiesLocationsAdminMunicipalitiesGetParams)

  const createMutation = useAdminCreateMunicipalityLocationsAdminMunicipalitiesPost()
  const patchMutation = useAdminPatchMunicipalityLocationsAdminMunicipalitiesMunicipalityIdPatch()
  const deleteMutation =
    useAdminDeleteMunicipalityLocationsAdminMunicipalitiesMunicipalityIdDelete()

  const crud = useCrudController<
    MunicipalityPublic,
    MunicipalityFormValues,
    PageMunicipalityPublic,
    { data: MunicipalityFormValues },
    { municipalityId: string; data: MunicipalityFormValues },
    { municipalityId: string }
  >({
    list,
    dialogs,
    query,
    queryKey: getAdminListMunicipalitiesLocationsAdminMunicipalitiesGetQueryKey(),
    getItems: (data) => data?.items ?? [],
    getTotal: (data) => data?.total ?? 0,
    create: {
      mutation: createMutation,
      toVariables: (values) => ({ data: values }),
    },
    update: {
      mutation: patchMutation,
      toVariables: (item, values) => ({
        municipalityId: item.id,
        data: values,
      }),
    },
    remove: {
      mutation: deleteMutation,
      toVariables: (item) => ({ municipalityId: item.id }),
    },
    entityLabel: 'Municipio',
    entityGender: 'm',
  })

  const columns = useMemo(
    () =>
      buildMunicipalityColumns({
        onEdit: dialogs.edit.open,
        onDelete: crud.remove.run,
        isDeleting: crud.remove.isPending,
      }),
    [crud.remove.isPending, crud.remove.run, dialogs.edit.open],
  )

  const editItem = dialogs.edit.item

  return (
    <PageWrapper
      title="Municipios"
      description="Catálogo de municipios del sistema."
      icon={MapPinned}
      buttons={[
        <Button
          key="create"
          size="sm"
          className="w-full sm:w-auto"
          icon={Plus}
          onClick={dialogs.create.open}
        >
          Nuevo municipio
        </Button>,
      ]}
    >
      <div className="space-y-4">
        <MunicipalityFilters
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
        title="Nuevo municipio"
        Form={MunicipalityForm}
        defaultValues={municipalityFormDefaultValues}
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
        title="Editar municipio"
        Form={MunicipalityForm}
        defaultValues={
          editItem
            ? { name: editItem.name, province_id: editItem.province_id }
            : municipalityFormDefaultValues
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
