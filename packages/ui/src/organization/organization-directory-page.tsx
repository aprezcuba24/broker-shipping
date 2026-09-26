import {
  OrganizationType,
  useAuth,
  useListOrganizationsDirectoryOrganizationsDirectoryGet,
  type ListOrganizationsDirectoryOrganizationsDirectoryGetParams,
  type OrganizationPublic,
} from '@broker/api'
import { Building2, LogIn, Plus } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../components/button'
import { BtnList } from '../components/btn-list'
import { DataTable } from '../components/data-table/data-table'
import type { ColumnDef } from '../components/data-table/types'
import { DebouncedInput } from '../components/debounced-input'
import { PageLoading } from '../components/page-loading'
import { PageWrapper } from '../components/page-wrapper'
import { ClearFiltersButton } from '../crud/components/clear-filters-button'
import {
  actionsColumn,
  createdAtColumn,
  textColumn,
} from '../crud/components/columns'
import { FilterBar } from '../crud/components/filter-bar'
import { useListParams } from '../crud/hooks/use-list-params'
import {
  useActiveOrganization,
  type OrganizationKind,
} from './active-organization-context'
import { CreateOrganizationDialogHost } from './create-organization-dialog-host'

export type OrganizationDirectoryPageProps = {
  organizationType: OrganizationKind
  title?: string
  description?: string
}

function buildDirectoryColumns(
  onEnter: (org: OrganizationPublic) => void,
): ColumnDef<OrganizationPublic>[] {
  return [
    textColumn<OrganizationPublic>({ id: 'name', header: 'Nombre' }),
    createdAtColumn<OrganizationPublic>(),
    actionsColumn<OrganizationPublic>((row) => (
      <BtnList>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onEnter(row)}
          aria-label={`Entrar a ${row.name}`}
        >
          <LogIn className="h-4 w-4" />
          Entrar
        </Button>
      </BtnList>
    )),
  ]
}

export function OrganizationDirectoryPage({
  organizationType,
  title = 'Organizaciones',
  description,
}: OrganizationDirectoryPageProps) {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const { setActiveOrganization, openCreateOrganization } = useActiveOrganization()

  const list = useListParams({
    filterKeys: ['search'] as const,
    defaultPageSize: 20,
  })

  const queryParams = {
    ...list.queryParams,
    type: organizationType,
  } as ListOrganizationsDirectoryOrganizationsDirectoryGetParams

  const query = useListOrganizationsDirectoryOrganizationsDirectoryGet(queryParams, {
    query: {
      enabled: Boolean(user?.is_super_admin),
    },
  })

  const handleEnter = useCallback(
    (org: OrganizationPublic) => {
      setActiveOrganization(org.id)
      void navigate('/')
    },
    [navigate, setActiveOrganization],
  )

  const columns = useMemo(() => buildDirectoryColumns(handleEnter), [handleEnter])

  if (authLoading) {
    return <PageLoading title="Cargando…" />
  }

  if (!user?.is_super_admin) {
    return <Navigate to="/" replace />
  }

  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0
  const typeLabel =
    organizationType === OrganizationType.provider ? 'proveedores' : 'gestores'
  const resolvedDescription =
    description ?? `Directorio de organizaciones de ${typeLabel}.`

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-8">
        <PageWrapper
          title={title}
          description={resolvedDescription}
          icon={Building2}
          buttons={[
            <Button key="create" type="button" onClick={() => openCreateOrganization()}>
              <Plus className="h-4 w-4" />
              Crear organización
            </Button>,
          ]}
        >
          <div className="space-y-4">
            <FilterBar>
              <DebouncedInput
                value={list.filters.search}
                onDebouncedChange={(value) => list.setFilter('search', value)}
                placeholder="Buscar por nombre…"
                aria-label="Buscar organización por nombre"
                className="min-w-0 flex-1"
              />
              {list.hasActiveFilters ? (
                <ClearFiltersButton onClear={list.resetFilters} />
              ) : null}
            </FilterBar>

            <DataTable
              columns={columns}
              data={items}
              isLoading={query.isLoading}
              getRowId={(row) => row.id}
              pagination={{
                page: list.page,
                pageSize: list.pageSize,
                total,
                onPageChange: list.setPage,
              }}
            />
          </div>
        </PageWrapper>
      </div>
      <CreateOrganizationDialogHost />
    </div>
  )
}
