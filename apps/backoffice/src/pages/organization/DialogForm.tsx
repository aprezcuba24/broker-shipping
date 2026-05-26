import { FormModal, type FormModalProps } from '@broker/ui'
import { OrganizationForm } from './form'
import type { OrganizationFormValues } from './organizations-context'

export type DialogFormProps = Omit<
  FormModalProps<OrganizationFormValues>,
  'Form'
>

export function DialogForm(props: DialogFormProps) {
  return <FormModal Form={OrganizationForm} {...props} />
}
