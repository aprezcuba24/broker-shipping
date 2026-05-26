import { formatApiError } from '@broker/api'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'

type MutationCallbacks<TError> = {
  onSuccess?: () => void
  onError?: (error: TError) => void
}

type UseCrudMutationHook<TError, TVariables> = (options?: {
  mutation?: MutationCallbacks<TError>
}) => {
  mutateAsync: (variables: TVariables) => Promise<unknown>
  isPending: boolean
}

type UseCrudListHook<TItem> = () => {
  data: TItem[] | undefined
  isLoading: boolean
}

export type UseCrudOptions<
  TItem,
  TFormValues,
  TCreateVariables,
  TPatchVariables,
  TDeleteVariables,
> = {
  useList: UseCrudListHook<TItem>
  getListQueryKey: () => QueryKey
  useCreate: UseCrudMutationHook<unknown, TCreateVariables>
  usePatch: UseCrudMutationHook<unknown, TPatchVariables>
  useDelete: UseCrudMutationHook<unknown, TDeleteVariables>
  toCreateVariables: (values: TFormValues) => TCreateVariables
  toPatchVariables: (item: TItem, values: TFormValues) => TPatchVariables | null
  toDeleteVariables: (item: TItem) => TDeleteVariables | null
}

export type CrudContextValue<TItem, TFormValues> = {
  items: TItem[]
  isLoading: boolean
  page: number
  setPage: (page: number) => void
  formError: string | null
  createFormKey: number
  isCreating: boolean
  isSubmitting: boolean
  isDeleting: boolean
  submitCreate: (values: TFormValues) => Promise<void>
  resetCreateForm: () => void
  submitEdit: (item: TItem, values: TFormValues) => Promise<void>
  clearFormError: () => void
  deleteItem: (item: TItem) => Promise<void>
}

export type UseCrudResult<TItem, TFormValues> = CrudContextValue<TItem, TFormValues>

export function useCRUD<
  TItem,
  TFormValues,
  TCreateVariables,
  TPatchVariables,
  TDeleteVariables,
>(
  options: UseCrudOptions<
    TItem,
    TFormValues,
    TCreateVariables,
    TPatchVariables,
    TDeleteVariables
  >,
): CrudContextValue<TItem, TFormValues> {
  const {
    useList,
    getListQueryKey,
    useCreate,
    usePatch,
    useDelete,
    toCreateVariables,
    toPatchVariables,
    toDeleteVariables,
  } = options

  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [formError, setFormError] = useState<string | null>(null)
  const [createFormKey, setCreateFormKey] = useState(0)

  const { data: items = [], isLoading } = useList()

  const invalidateList = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: getListQueryKey(),
    })
  }, [queryClient, getListQueryKey])

  const createMutation = useCreate({
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

  const patchMutation = usePatch({
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

  const deleteMutation = useDelete({
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
    async (values: TFormValues) => {
      setFormError(null)
      await createMutation.mutateAsync(toCreateVariables(values))
    },
    [createMutation, toCreateVariables],
  )

  const submitEdit = useCallback(
    async (item: TItem, values: TFormValues) => {
      const variables = toPatchVariables(item, values)
      if (!variables) return
      setFormError(null)
      await patchMutation.mutateAsync(variables)
    },
    [patchMutation, toPatchVariables],
  )

  const deleteItem = useCallback(
    async (item: TItem) => {
      const variables = toDeleteVariables(item)
      if (!variables) return
      await deleteMutation.mutateAsync(variables)
    },
    [deleteMutation, toDeleteVariables],
  )

  return useMemo(
    () => ({
      items,
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
      deleteItem,
    }),
    [
      items,
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
      deleteItem,
    ],
  )
}
