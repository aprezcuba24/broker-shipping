import {
  EntitySelect,
} from '@broker/ui'
import { useActiveOrganization } from '../contexts/active-organization-context'

export function OrganizationSelect() {
  const { organizations, activeOrganization, setActiveOrganization } =
    useActiveOrganization()

  if (organizations.length === 0 || !activeOrganization) return null

  return (
    <EntitySelect
      items={organizations}
      value={activeOrganization.id}
      onValueChange={setActiveOrganization}
      placeholder="Organización"
      aria-label="Organización activa"
      triggerClassName="h-9 w-full border-0 bg-surface-container-highest text-sm shadow-none sm:w-48 [&>span]:truncate"
      contentClassName="max-h-[min(16rem,50vh)]"
    />
  )
}
