import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type CreateOrganizationUiActions = {
  setOpen: (open: boolean) => void
  openCreateOrganization: () => void
}

const CreateOrganizationUiActionsContext = createContext<CreateOrganizationUiActions | null>(
  null,
)
const CreateOrganizationUiOpenContext = createContext(false)

export function CreateOrganizationUiProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const openCreateOrganization = useCallback(() => setOpen(true), [])

  const actions = useMemo<CreateOrganizationUiActions>(
    () => ({ setOpen, openCreateOrganization }),
    [openCreateOrganization],
  )

  return (
    <CreateOrganizationUiActionsContext value={actions}>
      <CreateOrganizationUiOpenContext value={open}>{children}</CreateOrganizationUiOpenContext>
    </CreateOrganizationUiActionsContext>
  )
}

export function useCreateOrganizationUi() {
  const actions = useContext(CreateOrganizationUiActionsContext)
  const open = useContext(CreateOrganizationUiOpenContext)
  if (!actions) {
    throw new Error('useCreateOrganizationUi must be used within CreateOrganizationUiProvider')
  }
  return { open, setOpen: actions.setOpen, openCreateOrganization: actions.openCreateOrganization }
}

export function useOpenCreateOrganization() {
  const actions = useContext(CreateOrganizationUiActionsContext)
  if (!actions) {
    throw new Error('useOpenCreateOrganization must be used within CreateOrganizationUiProvider')
  }
  return actions.openCreateOrganization
}
