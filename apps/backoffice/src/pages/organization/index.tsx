import { OrganizationsProvider } from './organizations-context'
import { OrganizationTable } from './table'

export function OrganizationPage() {
  return (
    <OrganizationsProvider>
      <OrganizationTable />
    </OrganizationsProvider>
  )
}
