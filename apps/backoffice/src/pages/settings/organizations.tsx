import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CreateOrganizationForm,
  PageWrapper,
} from '@broker/ui'
import { Building2 } from 'lucide-react'
import { useOrganizationsSettings } from '@/hooks/use-organizations-settings'

export function OrganizationsSettingsPage() {
  const {
    organizations,
    showForm,
    toggleForm,
    selectOrganization,
    createFormProps,
  } = useOrganizationsSettings()

  return (
    <PageWrapper
      title="Organizaciones"
      description="Gestiona las organizaciones a las que perteneces."
      icon={Building2}
      buttons={[
        <Button key="create" type="button" onClick={toggleForm}>
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
              {...createFormProps}
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
                onClick={() => selectOrganization(org.id)}
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
