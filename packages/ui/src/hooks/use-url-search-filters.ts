import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export function pickQueryParams(
  filters: Record<string, string>,
): Record<string, string> | undefined {
  const params: Record<string, string> = {}
  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      params[key] = value
    }
  }
  return Object.keys(params).length > 0 ? params : undefined
}

type UseUrlSearchFiltersOptions<K extends string> = {
  keys: readonly K[]
}

export function useUrlSearchFilters<K extends string>({
  keys,
}: UseUrlSearchFiltersOptions<K>) {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(() => {
    const next = {} as Record<K, string>
    for (const key of keys) {
      next[key] = searchParams.get(key) ?? ''
    }
    return next
  }, [keys, searchParams])

  const setFilter = useCallback(
    (key: K, value: string) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          if (value) {
            next.set(key, value)
          } else {
            next.delete(key)
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const setFilters = useCallback(
    (updates: Partial<Record<K, string>>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const key of keys) {
            const value = updates[key]
            if (value === undefined) continue
            if (value) {
              next.set(key, value)
            } else {
              next.delete(key)
            }
          }
          return next
        },
        { replace: true },
      )
    },
    [keys, setSearchParams],
  )

  return { filters, setFilter, setFilters }
}
