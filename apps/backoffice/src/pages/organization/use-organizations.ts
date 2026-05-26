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
  const [modalOpen, setModalOpen] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
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
        setModalOpen(false)
        setEditingOrg(null)
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

  const openEdit = useCallback((org: Organization) => {
    setFormError(null)
    setEditingOrg(org)
    setModalOpen(true)
  }, [])

  const resetCreateForm = useCallback(() => {
    setFormError(null)
    setCreateFormKey((key) => key + 1)
  }, [])

  const submitCreate = useCallback(
    async (values: OrganizationFormValues) => {
      setFormError(null)
      await createMutation.mutateAsync({ data: { name: values.name } })
    },
    [createMutation],
  )

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setEditingOrg(null)
    setFormError(null)
  }, [])

  const submitForm = useCallback(
    (values: OrganizationFormValues) => {
      setFormError(null)
      if (!editingOrg?.id) return
      patchMutation.mutate({
        organizationId: editingOrg.id,
        data: { name: values.name },
      })
    },
    [editingOrg, patchMutation],
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
    modalOpen,
    editingOrg,
    deleteTarget,
    formError,
    createFormKey,
    isCreating: createMutation.isPending,
    isSubmitting: patchMutation.isPending,
    isDeleting: deleteMutation.isPending,
    openEdit,
    closeModal,
    submitCreate,
    resetCreateForm,
    submitForm,
    requestDelete,
    cancelDelete,
    confirmDelete,
  }
}
