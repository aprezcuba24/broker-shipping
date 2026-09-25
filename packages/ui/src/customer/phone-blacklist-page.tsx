import {
  getListPhoneBlacklistPhoneBlacklistGetQueryKey,
  PhoneBlacklistReason,
  useCreatePhoneBlacklistEntryPhoneBlacklistPost,
  useListPhoneBlacklistPhoneBlacklistGet,
  useWithdrawPhoneBlacklistEntryPhoneBlacklistDelete,
  type CreatePhoneBlacklistEntryPhoneBlacklistPostParams,
  type ListPhoneBlacklistPhoneBlacklistGetParams,
  type PagePhoneBlacklistListItem,
  type PhoneBlacklistListItem,
  type WithdrawPhoneBlacklistEntryPhoneBlacklistDeleteParams,
} from '@broker/api'
import { Ban, Plus } from 'lucide-react'
import { useMemo } from 'react'

import { Button } from '../components/button'
import { DataTable } from '../components/data-table/data-table'
import { PageWrapper } from '../components/page-wrapper'
import { useActiveOrganization } from '../organization/active-organization-context'
import {
  EntityFormDialog,
  useCrudController,
  useCrudDialogs,
  useListParams,
} from '../crud'
import { buildPhoneBlacklistColumns } from './phone-blacklist-columns'
import {
  PhoneBlacklistFilters,
  phoneBlacklistListFilterKeys,
} from './phone-blacklist-filters'
import {
  PhoneBlacklistForm,
  phoneBlacklistFormDefaultValues,
  type PhoneBlacklistFormValues,
} from './phone-blacklist-form'

export type PhoneBlacklistPageProps = {
  description?: string
  customerHref?: (customerId: string) => string | undefined
}

function parseReasonFilter(
  value: string | undefined,
): PhoneBlacklistReason | undefined {
  if (
    value === PhoneBlacklistReason.nonpayment ||
    value === PhoneBlacklistReason.fraud ||
    value === PhoneBlacklistReason.abuse ||
    value === PhoneBlacklistReason.other
  ) {
    return value
  }
  return undefined
}

export function PhoneBlacklistPage({
  description = 'Números que tu organización tiene en lista negra. La comunidad ve el aviso; no frena pedidos.',
  customerHref,
}: PhoneBlacklistPageProps) {
  const { activeOrganization } = useActiveOrganization()
  const dialogs = useCrudDialogs<PhoneBlacklistListItem>()
  const list = useListParams({
    filterKeys: phoneBlacklistListFilterKeys,
    defaultPageSize: 20,
  })

  const query = useListPhoneBlacklistPhoneBlacklistGet({
    ...list.queryParams,
    phone: list.queryParams.phone || undefined,
    reason: parseReasonFilter(list.queryParams.reason),
  } as ListPhoneBlacklistPhoneBlacklistGetParams)

  const createMutation = useCreatePhoneBlacklistEntryPhoneBlacklistPost()
  const removeMutation = useWithdrawPhoneBlacklistEntryPhoneBlacklistDelete()

  const crud = useCrudController<
    PhoneBlacklistListItem,
    PhoneBlacklistFormValues,
    PagePhoneBlacklistListItem,
    {
      data: {
        phone: string
        reason: PhoneBlacklistReason
        note?: string
      }
      params: CreatePhoneBlacklistEntryPhoneBlacklistPostParams
    },
    never,
    {
      params: WithdrawPhoneBlacklistEntryPhoneBlacklistDeleteParams
    }
  >({
    list,
    dialogs,
    query,
    queryKey: getListPhoneBlacklistPhoneBlacklistGetQueryKey(),
    getItems: (data) => data?.items ?? [],
    getTotal: (data) => data?.total ?? 0,
    create: {
      mutation: createMutation,
      toVariables: (values) => ({
        data: {
          phone: values.phone,
          reason: values.reason,
          note:
            values.reason === PhoneBlacklistReason.other
              ? values.note?.trim() || undefined
              : values.note?.trim() || undefined,
        },
        params: {} as CreatePhoneBlacklistEntryPhoneBlacklistPostParams,
      }),
    },
    remove: {
      mutation: removeMutation,
      toVariables: (item) => ({
        params: {
          phone: item.phone,
        } as WithdrawPhoneBlacklistEntryPhoneBlacklistDeleteParams,
      }),
    },
    resetOn: [activeOrganization?.id],
    entityLabel: 'número',
    entityGender: 'm',
  })

  const columns = useMemo(
    () =>
      buildPhoneBlacklistColumns({
        onRemove: crud.remove.run,
        isRemoving: crud.remove.isPending,
        customerHref,
      }),
    [crud.remove.isPending, crud.remove.run, customerHref],
  )

  return (
    <PageWrapper
      title="Lista negra"
      description={description}
      icon={Ban}
      buttons={[
        <Button
          key="create"
          size="sm"
          className="w-full sm:w-auto"
          icon={Plus}
          onClick={dialogs.create.open}
        >
          Agregar teléfono
        </Button>,
      ]}
    >
      <div className="space-y-4">
        <PhoneBlacklistFilters
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
          emptyMessage="No hay teléfonos en tu lista negra."
          pagination={{
            page: list.page,
            pageSize: list.pageSize,
            total: crud.total,
            onPageChange: list.setPage,
          }}
        />
      </div>

      <EntityFormDialog
        title="Agregar a lista negra"
        Form={PhoneBlacklistForm}
        defaultValues={phoneBlacklistFormDefaultValues}
        formKey={dialogs.create.formKey}
        open={dialogs.create.isOpen}
        onOpenChange={(open) => {
          dialogs.create.setOpen(open)
          if (!open) crud.create.clearError()
        }}
        onSubmit={crud.create.run}
        isSubmitting={crud.create.isPending}
        error={crud.create.error}
        acceptLabel="Agregar"
      />
    </PageWrapper>
  )
}
