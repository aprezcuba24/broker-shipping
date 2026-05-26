import {
  formatApiError,
  getListOrganizationsOrganizationsGetQueryKey,
  useCreateOrganizationOrganizationsPost,
  useDeleteOrganizationOrganizationsOrganizationIdDelete,
  useListOrganizationsOrganizationsGet,
  usePatchOrganizationOrganizationsOrganizationIdPatch,
  type Organization,
} from '@broker/api'
import { useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type OrganizationFormValues = {
  name: string
}

export type OrganizationsContextValue = {
  organizations: Organization[]
  isLoading: boolean
  page: number
  setPage: (page: number) => void
  formError: string | null
  createFormKey: number
  isCreating: boolean
  isSubmitting: boolean
  isDeleting: boolean
  submitCreate: (values: OrganizationFormValues) => Promise<void>
  resetCreateForm: () => void
  submitEdit: (org: Organization, values: OrganizationFormValues) => Promise<void>
  clearFormError: () => void
  deleteOrganization: (org: Organization) => Promise<void>
}

const OrganizationsContext = createContext<OrganizationsContextValue | null>(null)

function useOrganizationsState(): OrganizationsContextValue {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [formError, setFormError] = useState<string | null>(null)
  const [createFormKey, setCreateFormKey] = useState(0)

  const { data: organizations = [], isLoading } = useListOrganizationsOrganizationsGet()

  const invalidateList = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: getListOrganizationsOrganizationsGetQueryKey(),
    })
  }, [queryClient])

  const createMutation = useCreateOrganizationOrganizationsPost({
    mutation: {
      onSuccess: () => {
        invalidateList()
        setFormError(null)
      },
      onError: (error) => {
        setFormError(formatApiError(error))
      },
    },
  })

  const patchMutation = usePatchOrganizationOrganizationsOrganizationIdPatch({
    mutation: {
      onSuccess: () => {
        invalidateList()
        setFormError(null)
      },
      onError: (error) => {
        setFormError(formatApiError(error))
      },
    },
  })

  const deleteMutation = useDeleteOrganizationOrganizationsOrganizationIdDelete({
    mutation: {
      onSuccess: () => {
        invalidateList()
      },
    },
  })

  const resetCreateForm = useCallback(() => {
    setFormError(null)
    setCreateFormKey((key) => key + 1)
  }, [])

  const clearFormError = useCallback(() => {
    setFormError(null)
  }, [])

  const submitCreate = useCallback(
    async (values: OrganizationFormValues) => {
      setFormError(null)
      await createMutation.mutateAsync({ data: { name: values.name } })
    },
    [createMutation],
  )

  const submitEdit = useCallback(
    async (org: Organization, values: OrganizationFormValues) => {
      if (!org.id) return
      setFormError(null)
      await patchMutation.mutateAsync({
        organizationId: org.id,
        data: { name: values.name },
      })
    },
    [patchMutation],
  )

  const deleteOrganization = useCallback(
    async (org: Organization) => {
      if (!org.id) return
      await deleteMutation.mutateAsync({ organizationId: org.id })
    },
    [deleteMutation],
  )

  return useMemo(
    () => ({
      organizations,
      isLoading,
      page,
      setPage,
      formError,
      createFormKey,
      isCreating: createMutation.isPending,
      isSubmitting: patchMutation.isPending,
      isDeleting: deleteMutation.isPending,
      submitCreate,
      resetCreateForm,
      submitEdit,
      clearFormError,
      deleteOrganization,
    }),
    [
      organizations,
      isLoading,
      page,
      formError,
      createFormKey,
      createMutation.isPending,
      patchMutation.isPending,
      deleteMutation.isPending,
      submitCreate,
      resetCreateForm,
      submitEdit,
      clearFormError,
      deleteOrganization,
    ],
  )
}

export function OrganizationsProvider({ children }: { children: ReactNode }) {
  const value = useOrganizationsState()
  return <OrganizationsContext value={value}>{children}</OrganizationsContext>
}

export function useOrganizations(): OrganizationsContextValue {
  const context = useContext(OrganizationsContext)
  if (!context) {
    throw new Error('useOrganizations must be used within OrganizationsProvider')
  }
  return context
}
