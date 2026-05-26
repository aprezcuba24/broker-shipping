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
import { useCallback, useState } from 'react'

export type OrganizationFormValues = {
  name: string
}

export function useOrganizations() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<Organization | null>(null)
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
        setDeleteTarget(null)
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

  const requestDelete = useCallback((org: Organization) => {
    setDeleteTarget(org)
  }, [])

  const cancelDelete = useCallback(() => {
    setDeleteTarget(null)
  }, [])

  const confirmDelete = useCallback(() => {
    if (!deleteTarget?.id) return
    deleteMutation.mutate({ organizationId: deleteTarget.id })
  }, [deleteTarget, deleteMutation])

  return {
    organizations,
    isLoading,
    page,
    setPage,
    deleteTarget,
    formError,
    createFormKey,
    isCreating: createMutation.isPending,
    isSubmitting: patchMutation.isPending,
    isDeleting: deleteMutation.isPending,
    submitCreate,
    resetCreateForm,
    submitEdit,
    clearFormError,
    requestDelete,
    cancelDelete,
    confirmDelete,
  }
}
