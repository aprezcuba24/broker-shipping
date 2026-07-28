import { formatApiError } from '@broker/api'
import { useQueryClient, type QueryKey, type UseQueryResult } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

import { useResetOnChange } from '../../hooks/use-reset-on-change'
import { useAsyncAction, type AsyncAction } from './use-async-action'
import type { CrudDialogs } from './use-crud-dialogs'
import type { ListParams } from './use-list-params'

export type CrudAction = 'create' | 'update' | 'remove'

type MutationLike<TVariables> = {
  mutateAsync: (variables: TVariables) => Promise<unknown>
  isPending: boolean
}

type QueryLike<TData> = Pick<UseQueryResult<TData>, 'data' | 'isLoading' | 'isFetching'>

export type UseCrudControllerOptions<
  TItem,
  TFormValues,
  TListData = unknown,
  TCreateVariables = unknown,
  TUpdateVariables = unknown,
  TDeleteVariables = unknown,
> = {
  list: Pick<ListParams<string>, 'setPage' | 'resetFilters'>
  /** Required for modal create/edit; omit for full-page form CRUDs. */
  dialogs?: CrudDialogs<TItem>
  query: QueryLike<TListData>
  queryKey: QueryKey
  getItems?: (data: TListData | undefined) => TItem[]
  getTotal?: (data: TListData | undefined, items: TItem[]) => number
  create?: {
    mutation: MutationLike<TCreateVariables>
    toVariables: (values: TFormValues) => TCreateVariables | null
  }
  update?: {
    mutation: MutationLike<TUpdateVariables>
    toVariables: (item: TItem, values: TFormValues) => TUpdateVariables | null
  }
  remove?: {
    mutation: MutationLike<TDeleteVariables>
    toVariables: (item: TItem) => TDeleteVariables | null
  }
  resetOn?: readonly unknown[]
  onSuccess?: (action: CrudAction, result: unknown) => void | Promise<void>
  onError?: (error: unknown, action: CrudAction) => void
}

export type CrudController<TItem, TFormValues> = {
  items: TItem[]
  total: number
  isLoading: boolean
  create: AsyncAction<[TFormValues], unknown>
  update: AsyncAction<[TFormValues], unknown>
  remove: AsyncAction<[TItem], unknown>
}

function defaultGetItems<TItem, TListData>(data: TListData | undefined): TItem[] {
  if (data === undefined || data === null) return []
  if (Array.isArray(data)) return data as TItem[]
  if (typeof data === 'object' && 'items' in data) {
    const items = (data as { items: unknown }).items
    if (Array.isArray(items)) return items as TItem[]
  }
  return []
}

function defaultGetTotal<TItem, TListData>(data: TListData | undefined, items: TItem[]): number {
  if (data !== undefined && data !== null && typeof data === 'object' && 'total' in data) {
    const total = (data as { total: unknown }).total
    if (typeof total === 'number') return total
  }
  return items.length
}

export function useCrudController<
  TItem,
  TFormValues,
  TListData = unknown,
  TCreateVariables = unknown,
  TUpdateVariables = unknown,
  TDeleteVariables = unknown,
>({
  list,
  dialogs,
  query,
  queryKey,
  getItems = defaultGetItems,
  getTotal = defaultGetTotal,
  create,
  update,
  remove,
  resetOn,
  onSuccess,
  onError,
}: UseCrudControllerOptions<
  TItem,
  TFormValues,
  TListData,
  TCreateVariables,
  TUpdateVariables,
  TDeleteVariables
>): CrudController<TItem, TFormValues> {
  const queryClient = useQueryClient()

  useResetOnChange({
    resetOnChange: resetOn,
    getQueryKey: () => queryKey,
    onReset: list.resetFilters,
    setPage: list.setPage,
  })

  const items = useMemo(() => getItems(query.data), [getItems, query.data])
  const total = useMemo(() => getTotal(query.data, items), [getTotal, items, query.data])

  const invalidateList = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey })
  }, [queryClient, queryKey])

  const createAction = useAsyncAction(
    async (values: TFormValues) => {
      if (!create) throw new Error('Create mutation is not configured')
      const variables = create.toVariables(values)
      if (variables === null) throw new Error('Create skipped: toVariables returned null')
      return create.mutation.mutateAsync(variables)
    },
    async (result) => {
      if (onSuccess) {
        await onSuccess('create', result)
        return
      }
      await invalidateList()
      dialogs?.create.close()
    },
    (error) => {
      onError?.(error, 'create')
      return formatApiError(error)
    },
  )

  const updateAction = useAsyncAction(
    async (values: TFormValues) => {
      if (!update) throw new Error('Update mutation is not configured')
      const item = dialogs?.edit.item
      if (!item) throw new Error('Update skipped: no item selected')
      const variables = update.toVariables(item, values)
      if (variables === null) throw new Error('Update skipped: toVariables returned null')
      return update.mutation.mutateAsync(variables)
    },
    async (result) => {
      if (onSuccess) {
        await onSuccess('update', result)
        return
      }
      await invalidateList()
      dialogs?.edit.close()
    },
    (error) => {
      onError?.(error, 'update')
      return formatApiError(error)
    },
  )

  const removeAction = useAsyncAction(
    async (item: TItem) => {
      if (!remove) throw new Error('Delete mutation is not configured')
      const variables = remove.toVariables(item)
      if (variables === null) throw new Error('Delete skipped: toVariables returned null')
      return remove.mutation.mutateAsync(variables)
    },
    async (result) => {
      if (onSuccess) {
        await onSuccess('remove', result)
        return
      }
      await invalidateList()
    },
    (error) => {
      onError?.(error, 'remove')
      return formatApiError(error)
    },
  )

  return {
    items,
    total,
    isLoading: query.isLoading || Boolean(query.isFetching && !query.data),
    create: {
      ...createAction,
      isPending: createAction.isPending || Boolean(create?.mutation.isPending),
    },
    update: {
      ...updateAction,
      isPending: updateAction.isPending || Boolean(update?.mutation.isPending),
    },
    remove: {
      ...removeAction,
      isPending: removeAction.isPending || Boolean(remove?.mutation.isPending),
    },
  }
}
