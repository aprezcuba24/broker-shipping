import { CreateOrganizationDialog } from './create-organization-dialog'
import { useCreateOrganizationUi } from './create-organization-ui-context'

/** Mount outside DropdownMenuContent so the dialog stays mounted when the menu closes. */
export function CreateOrganizationDialogHost() {
  const { open, setOpen } = useCreateOrganizationUi()
  return <CreateOrganizationDialog open={open} onOpenChange={setOpen} />
}
