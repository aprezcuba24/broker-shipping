import type { QueryKey } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import type { EntityGender } from '../../lib/notify'
import { useAsyncAction, type AsyncAction } from './use-async-action'
import { useQueryCacheSync } from './use-query-cache-sync'

export type UseEntityFormMutationOptions<TArgs extends unknown[], TResult> = {
  mutate: (...args: TArgs) => Promise<TResult>
  detailQueryKey?: QueryKey
  invalidateKeys?: QueryKey[]
  redirectTo: string
  onSuccess?: (result: TResult, ...args: TArgs) => void | Promise<void>
  onError?: (error: unknown, ...args: TArgs) => string
  /** Entity name for success toasts (e.g. "Producto"). */
  entityLabel?: string
  entityGender?: EntityGender
  mode?: 'create' | 'update'
  /** When false, skip success toasts even if entityLabel is set. Default: true when entityLabel is set. */
  toast?: boolean
}

/**
 * Full-page form mutation: run mutate → sync React Query cache → optional
 * onSuccess → navigate. Compose `useQueryCacheSync` + `useAsyncAction` yourself
 * when you need a different success flow.
 */
export function useEntityFormMutation<TArgs extends unknown[], TResult>({
  mutate,
  detailQueryKey,
  invalidateKeys,
  redirectTo,
  onSuccess,
  onError,
  entityLabel,
  entityGender = 'm',
  mode = 'create',
  toast: toastEnabled,
}: UseEntityFormMutationOptions<TArgs, TResult>): AsyncAction<TArgs, TResult> {
  const navigate = useNavigate()
  const { sync } = useQueryCacheSync({ detailQueryKey, invalidateKeys })
  const showToast = Boolean(entityLabel) && toastEnabled !== false

  const successMessage =
    showToast && entityLabel
      ? mode === 'update'
        ? entityGender === 'f'
          ? `${entityLabel} actualizada`
          : `${entityLabel} actualizado`
        : entityGender === 'f'
          ? `${entityLabel} creada`
          : `${entityLabel} creado`
      : undefined

  return useAsyncAction(
    mutate,
    async (result, ...args) => {
      await sync(result)
      await onSuccess?.(result, ...args)
      navigate(redirectTo)
    },
    onError,
    successMessage ? { success: successMessage } : undefined,
  )
}
