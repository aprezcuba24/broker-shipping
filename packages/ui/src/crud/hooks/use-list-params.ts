import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import { pickQueryParams } from '../../hooks/use-url-search-filters'

const PAGE_KEY = 'page'
const PAGE_SIZE_KEY = 'page_size'

export type UseListParamsOptions<K extends string> = {
  filterKeys?: readonly K[]
  defaultPageSize?: number
  /** When true (default), page / page_size / filters live in the URL query string. */
  syncToUrl?: boolean
  /** When true (default), changing a filter resets page to 1. */
  resetPageOnFilterChange?: boolean
}

export type ListParams<K extends string> = {
  page: number
  pageSize: number
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  filters: Record<K, string>
  setFilter: (key: K, value: string) => void
  setFilters: (updates: Partial<Record<K, string>>) => void
  resetFilters: () => void
  hasActiveFilters: boolean
  /** Ready to spread into Orval list hooks: `{ page, page_size, ...nonEmptyFilters }`. */
  queryParams: {
    page: number
    page_size: number
  } & Partial<Record<K, string>>
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : fallback
}

export function useListParams<K extends string = never>({
  filterKeys = [] as unknown as readonly K[],
  defaultPageSize = 20,
  syncToUrl = true,
  resetPageOnFilterChange = true,
}: UseListParamsOptions<K> = {}): ListParams<K> {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = syncToUrl ? parsePositiveInt(searchParams.get(PAGE_KEY), 1) : 1
  const pageSize = syncToUrl
    ? parsePositiveInt(searchParams.get(PAGE_SIZE_KEY), defaultPageSize)
    : defaultPageSize

  const filters = useMemo(() => {
    const next = {} as Record<K, string>
    for (const key of filterKeys) {
      next[key] = syncToUrl ? (searchParams.get(key) ?? '') : ''
    }
    return next
  }, [filterKeys, searchParams, syncToUrl])

  const setPage = useCallback(
    (nextPage: number) => {
      if (!syncToUrl) return
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          if (nextPage <= 1) {
            next.delete(PAGE_KEY)
          } else {
            next.set(PAGE_KEY, String(nextPage))
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams, syncToUrl],
  )

  const setPageSize = useCallback(
    (nextPageSize: number) => {
      if (!syncToUrl) return
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          if (nextPageSize === defaultPageSize) {
            next.delete(PAGE_SIZE_KEY)
          } else {
            next.set(PAGE_SIZE_KEY, String(nextPageSize))
          }
          next.delete(PAGE_KEY)
          return next
        },
        { replace: true },
      )
    },
    [defaultPageSize, setSearchParams, syncToUrl],
  )

  const setFilter = useCallback(
    (key: K, value: string) => {
      if (!syncToUrl) return
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          if (value) {
            next.set(key, value)
          } else {
            next.delete(key)
          }
          if (resetPageOnFilterChange) {
            next.delete(PAGE_KEY)
          }
          return next
        },
        { replace: true },
      )
    },
    [resetPageOnFilterChange, setSearchParams, syncToUrl],
  )

  const setFilters = useCallback(
    (updates: Partial<Record<K, string>>) => {
      if (!syncToUrl) return
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const key of filterKeys) {
            const value = updates[key]
            if (value === undefined) continue
            if (value) {
              next.set(key, value)
            } else {
              next.delete(key)
            }
          }
          if (resetPageOnFilterChange) {
            next.delete(PAGE_KEY)
          }
          return next
        },
        { replace: true },
      )
    },
    [filterKeys, resetPageOnFilterChange, setSearchParams, syncToUrl],
  )

  const resetFilters = useCallback(() => {
    setFilters(Object.fromEntries(filterKeys.map((key) => [key, ''])) as Partial<Record<K, string>>)
  }, [filterKeys, setFilters])

  const hasActiveFilters = useMemo(
    () => filterKeys.some((key) => Boolean(filters[key])),
    [filterKeys, filters],
  )

  const queryParams = useMemo(() => {
    const picked = pickQueryParams(filters as Record<string, string>) ?? {}
    return {
      page,
      page_size: pageSize,
      ...picked,
    } as {
      page: number
      page_size: number
    } & Partial<Record<K, string>>
  }, [filters, page, pageSize])

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    filters,
    setFilter,
    setFilters,
    resetFilters,
    hasActiveFilters,
    queryParams,
  }
}
