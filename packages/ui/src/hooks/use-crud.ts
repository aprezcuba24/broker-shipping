import { brokerFetch, formatApiError } from '@broker/api'
import {
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { pickQueryParams } from './use-url-search-filters'

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

type UseCrudOrvalListHook<TItem> = (options?: {
  query?: Partial<UseQueryOptions<TItem[], unknown, TItem[]>>
}) => Pick<UseQueryResult<TItem[], unknown>, 'data' | 'isLoading'>

export type UseCrudOptions<
  TItem,
  TFormValues,
  TCreateVariables,
  TPatchVariables,
  TDeleteVariables,
> = {
  useList: UseCrudOrvalListHook<TItem>
  getListQueryKey: () => QueryKey
  useCreate: UseCrudMutationHook<unknown, TCreateVariables>
  usePatch: UseCrudMutationHook<unknown, TPatchVariables>
  useDelete: UseCrudMutationHook<unknown, TDeleteVariables>
  toCreateVariables: (values: TFormValues) => TCreateVariables
  toPatchVariables: (item: TItem, values: TFormValues) => TPatchVariables | null
  toDeleteVariables: (item: TItem) => TDeleteVariables | null
  /** When set, list requests include non-empty values as query params (URL-synced filters). */
  filters?: Record<string, string>
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

function useCrudListQuery<TItem>(
  useList: UseCrudOrvalListHook<TItem>,
  getListQueryKey: () => QueryKey,
  filters: Record<string, string> | undefined,
): { data: TItem[] | undefined; isLoading: boolean } {
  const requestParams = useMemo(
    () => (filters !== undefined ? pickQueryParams(filters) : undefined),
    [filters],
  )
  const baseQueryKey = getListQueryKey()
  const listUrl = String(baseQueryKey[0])
  const usesFilteredFetch = filters !== undefined

  const filteredQuery = useQuery({
    queryKey: [...baseQueryKey, requestParams ?? {}],
    queryFn: ({ signal }) =>
      brokerFetch<TItem[]>({
        url: listUrl,
        method: 'GET',
        params: requestParams,
        signal,
      }),
    enabled: usesFilteredFetch,
  })

  const defaultQuery = useList({
    query: usesFilteredFetch ? { enabled: false } : undefined,
  })

  if (usesFilteredFetch) {
    return {
      data: filteredQuery.data,
      isLoading: filteredQuery.isLoading,
    }
  }

  return {
    data: defaultQuery.data,
    isLoading: defaultQuery.isLoading,
  }
}

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
    filters,
  } = options

  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [formError, setFormError] = useState<string | null>(null)
  const [createFormKey, setCreateFormKey] = useState(0)

  const requestParams = useMemo(
    () => (filters !== undefined ? pickQueryParams(filters) : undefined),
    [filters],
  )

  const listParamsKey = useMemo(
    () => JSON.stringify(requestParams ?? {}),
    [requestParams],
  )

  const prevListParamsKeyRef = useRef(listParamsKey)

  useEffect(() => {
    if (filters === undefined) return
    if (prevListParamsKeyRef.current !== listParamsKey) {
      prevListParamsKeyRef.current = listParamsKey
      setPage(1)
    }
  }, [filters, listParamsKey])

  const { data: items = [], isLoading } = useCrudListQuery(
    useList,
    getListQueryKey,
    filters,
  )

  const invalidateList = useCallback(() => {
    const baseKey = getListQueryKey()
    void queryClient.invalidateQueries({
      queryKey:
        filters !== undefined ? [...baseKey, requestParams ?? {}] : baseKey,
    })
  }, [queryClient, getListQueryKey, filters, requestParams])

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
