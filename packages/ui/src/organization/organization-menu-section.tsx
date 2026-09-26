import { useAuth } from '@broker/api'
import { Building2, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from '../components/dropdown-menu'
import { useActiveOrganization } from './active-organization-context'

export function OrganizationMenuSection() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    organizations,
    activeOrganization,
    setActiveOrganization,
    organizationType,
    isLoading,
    openCreateOrganization,
  } = useActiveOrganization()

  if (isLoading || !organizationType) return null

  if (user?.is_super_admin) {
    return (
      <>
        <DropdownMenuSeparator />
        {activeOrganization ? (
          <>
            <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Organización activa
            </DropdownMenuLabel>
            <DropdownMenuItem disabled className="opacity-100">
              <Building2 />
              {activeOrganization.name}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuItem onSelect={() => void navigate('/organizations')}>
          <Building2 />
          Cambiar organización
        </DropdownMenuItem>
      </>
    )
  }

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
