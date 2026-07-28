import {
  formatApiError,
  getMyOrganizationsUsersMyOrganizationsGetQueryKey,
  OrganizationType,
  useCreateOrganizationOrganizationsPost,
  useListOrganizationsOrganizationsGet,
} from '@broker/api'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CreateOrganizationForm,
  PageWrapper,
  useActiveOrganization,
} from '@broker/ui'
import { useQueryClient } from '@tanstack/react-query'
import { Building2 } from 'lucide-react'
import { useState } from 'react'

export function OrganizationsSettingsPage() {
  const { organizations, setActiveOrganization } = useActiveOrganization()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const createMutation = useCreateOrganizationOrganizationsPost()
  const listQuery = useListOrganizationsOrganizationsGet()

  return (
    <PageWrapper
      title="Organizaciones"
      description="Gestiona las organizaciones a las que perteneces."
      icon={Building2}
      buttons={[
        <Button key="create" type="button" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancelar' : 'Crear organización'}
        </Button>,
      ]}
    >
      {showForm ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Nueva organización</CardTitle>
            <CardDescription>Crea otra organización proveedora.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateOrganizationForm
              embedded
              submitLabel="Crear"
              isSubmitting={createMutation.isPending}
              error={
                createMutation.isError
                  ? formatApiError(createMutation.error, 'No se pudo crear.')
                  : null
              }
              onSubmit={async ({ name }) => {
                createMutation.reset()
                const org = await createMutation.mutateAsync({
                  data: { name, type: OrganizationType.provider },
                })
                await queryClient.invalidateQueries({
                  queryKey: getMyOrganizationsUsersMyOrganizationsGetQueryKey(),
                })
                await listQuery.refetch()
                setActiveOrganization(org.id)
                setShowForm(false)
              }}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Tus organizaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {organizations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no tienes organizaciones.</p>
          ) : (
            organizations.map((org) => (
              <button
                key={org.id}
                type="button"
                className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-muted/50"
                onClick={() => setActiveOrganization(org.id)}
              >
                <span className="font-medium">{org.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{org.id}</span>
              </button>
            ))
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  )
}
