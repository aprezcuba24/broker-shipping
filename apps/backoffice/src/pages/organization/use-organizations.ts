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
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Organization | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

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
        setModalOpen(false)
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

  const openCreate = useCallback(() => {
    setFormError(null)
    setEditingOrg(null)
    setModalMode('create')
    setModalOpen(true)
  }, [])

  const openEdit = useCallback((org: Organization) => {
    setFormError(null)
    setEditingOrg(org)
    setModalMode('edit')
    setModalOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setEditingOrg(null)
    setFormError(null)
  }, [])

  const submitForm = useCallback(
    (values: OrganizationFormValues) => {
      setFormError(null)
      if (modalMode === 'create') {
        createMutation.mutate({ data: { name: values.name } })
        return
      }
      if (!editingOrg?.id) return
      patchMutation.mutate({
        organizationId: editingOrg.id,
        data: { name: values.name },
      })
    },
    [modalMode, editingOrg, createMutation, patchMutation],
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

  const isSubmitting = createMutation.isPending || patchMutation.isPending

  return {
    organizations,
    isLoading,
    page,
    setPage,
    modalOpen,
    modalMode,
    editingOrg,
    deleteTarget,
    formError,
    isSubmitting,
    isDeleting: deleteMutation.isPending,
    openCreate,
    openEdit,
    closeModal,
    submitForm,
    requestDelete,
    cancelDelete,
    confirmDelete,
  }
}
