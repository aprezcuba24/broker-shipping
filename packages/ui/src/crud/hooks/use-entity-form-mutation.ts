import type { QueryKey } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { useAsyncAction, type AsyncAction } from './use-async-action'
import { useQueryCacheSync } from './use-query-cache-sync'

export type UseEntityFormMutationOptions<TArgs extends unknown[], TResult> = {
  mutate: (...args: TArgs) => Promise<TResult>
  detailQueryKey?: QueryKey
  invalidateKeys?: QueryKey[]
  redirectTo: string
  onSuccess?: (result: TResult, ...args: TArgs) => void | Promise<void>
  onError?: (error: unknown, ...args: TArgs) => string
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
}: UseEntityFormMutationOptions<TArgs, TResult>): AsyncAction<TArgs, TResult> {
  const navigate = useNavigate()
  const { sync } = useQueryCacheSync({ detailQueryKey, invalidateKeys })

  return useAsyncAction(
    mutate,
    async (result, ...args) => {
      await sync(result)
      await onSuccess?.(result, ...args)
      navigate(redirectTo)
    },
    onError,
  )
}
