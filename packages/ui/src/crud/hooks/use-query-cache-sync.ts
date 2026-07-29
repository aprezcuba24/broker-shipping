import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { useCallback } from 'react'

export type UseQueryCacheSyncOptions = {
  /** If set, writes the mutation result into this query cache entry. */
  detailQueryKey?: QueryKey
  /** Query keys to invalidate after the write (list, detail, etc.). */
  invalidateKeys?: QueryKey[]
}

export type QueryCacheSync = {
  sync: (result?: unknown) => Promise<void>
}

export function useQueryCacheSync({
  detailQueryKey,
  invalidateKeys,
}: UseQueryCacheSyncOptions = {}): QueryCacheSync {
  const queryClient = useQueryClient()

  const sync = useCallback(
    async (result?: unknown) => {
      if (detailQueryKey !== undefined && result !== undefined) {
        queryClient.setQueryData(detailQueryKey, result)
      }
      if (invalidateKeys && invalidateKeys.length > 0) {
        await Promise.all(
          invalidateKeys.map((queryKey) =>
            queryClient.invalidateQueries({ queryKey }),
          ),
        )
      }
    },
    [detailQueryKey, invalidateKeys, queryClient],
  )

  return { sync }
}
