import {
  getListOrganizationsOrganizationsGetQueryKey,
  useCreateOrganizationOrganizationsPost,
  useDeleteOrganizationOrganizationsOrganizationIdDelete,
  useListOrganizationsOrganizationsGet,
  usePatchOrganizationOrganizationsOrganizationIdPatch,
  type Organization,
} from '@broker/api'
import { useCRUD, type CrudContextValue } from '@broker/ui'
import {
  createContext,
  useContext,
  type ReactNode,
} from 'react'
import { z } from 'zod'

export const organizationFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(255, 'Máximo 255 caracteres'),
})

export type OrganizationFormValues = z.infer<typeof organizationFormSchema>

export type OrganizationsContextValue = CrudContextValue<
  Organization,
  OrganizationFormValues
>

const OrganizationsContext = createContext<OrganizationsContextValue | null>(null)

export function OrganizationsProvider({ children }: { children: ReactNode }) {
  const value = useCRUD<
    Organization,
    OrganizationFormValues,
    { data: { name: string } },
    { organizationId: string; data: { name: string } },
    { organizationId: string }
  >({
    useList: useListOrganizationsOrganizationsGet,
    getListQueryKey: getListOrganizationsOrganizationsGetQueryKey,
    useCreate: useCreateOrganizationOrganizationsPost,
    usePatch: usePatchOrganizationOrganizationsOrganizationIdPatch,
    useDelete: useDeleteOrganizationOrganizationsOrganizationIdDelete,
    toCreateVariables: (values) => ({ data: { name: values.name } }),
    toPatchVariables: (org, values) =>
      org.id ? { organizationId: org.id, data: { name: values.name } } : null,
    toDeleteVariables: (org) =>
      org.id ? { organizationId: org.id } : null,
  })
  return <OrganizationsContext value={value}>{children}</OrganizationsContext>
}

export function useOrganizations(): OrganizationsContextValue {
  const context = useContext(OrganizationsContext)
  if (!context) {
    throw new Error('useOrganizations must be used within OrganizationsProvider')
  }
  return context
}
