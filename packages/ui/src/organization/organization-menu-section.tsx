import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from '../components/dropdown-menu'
import { useActiveOrganization } from './active-organization-context'

export function OrganizationMenuSection() {
  const { organizations, activeOrganization, setActiveOrganization, isLoading } =
    useActiveOrganization()

  if (isLoading || organizations.length === 0 || !activeOrganization) return null

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Organizaciones
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup
        value={activeOrganization.id}
        onValueChange={setActiveOrganization}
      >
        {organizations.map((org) => (
          <DropdownMenuRadioItem key={org.id} value={org.id}>
            {org.name}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </>
  )
}
