import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@broker/ui'
import { useActiveOrganization } from '../contexts/active-organization-context'

export function OrganizationSelect() {
  const { organizations, activeOrganization, setActiveOrganization } =
    useActiveOrganization()

  if (organizations.length === 0 || !activeOrganization) return null

  return (
    <Select value={activeOrganization.id} onValueChange={setActiveOrganization}>
      <SelectTrigger
        aria-label="Organización activa"
        className="h-9 w-full border-0 bg-surface-container-highest text-sm shadow-none sm:w-48 [&>span]:truncate"
      >
        <SelectValue placeholder="Organización" />
      </SelectTrigger>
      <SelectContent align="start" className="max-h-[min(16rem,50vh)]">
        {organizations.map((organization) => {
          if (!organization.id) return null

          return (
            <SelectItem key={organization.id} value={organization.id}>
              {organization.name}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
