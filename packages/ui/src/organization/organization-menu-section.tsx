import { Plus } from 'lucide-react'
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from '../components/dropdown-menu'
import { useActiveOrganization } from './active-organization-context'

export function OrganizationMenuSection() {
  const {
    organizations,
    activeOrganization,
    setActiveOrganization,
    organizationType,
    isLoading,
    openCreateOrganization,
  } = useActiveOrganization()

  if (isLoading || !organizationType) return null

  return (
    <>
      <DropdownMenuSeparator />
      {activeOrganization && organizations.length > 0 ? (
        <>
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
          <DropdownMenuSeparator />
        </>
      ) : null}
      <DropdownMenuItem onSelect={() => openCreateOrganization()}>
        <Plus />
        Crear organización
      </DropdownMenuItem>
    </>
  )
}
