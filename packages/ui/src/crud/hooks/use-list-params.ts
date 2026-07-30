import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

const PAGE_KEY = 'page'
const PAGE_SIZE_KEY = 'page_size'

export type FilterValue = string | string[]

export type UseListParamsOptions<
  K extends string = never,
  A extends string = never,
> = {
  filterKeys?: readonly K[]
  /** Keys stored/read as string arrays (repeated or comma-separated URL params). */
  arrayFilterKeys?: readonly A[]
  defaultPageSize?: number
  /** When true (default), page / page_size / filters live in the URL query string. */
  syncToUrl?: boolean
  /** When true (default), changing a filter resets page to 1. */
  resetPageOnFilterChange?: boolean
}

type FiltersState<K extends string, A extends string> = Record<K, string> & Record<A, string[]>

type QueryParamsState<K extends string, A extends string> = {
  page: number
  page_size: number
} & Partial<Record<K, string>> &
  Partial<Record<A, string[]>>

export type ListParams<K extends string = never, A extends string = never> = {
  page: number
  pageSize: number
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  filters: FiltersState<K, A>
  setFilter: <Key extends K | A>(
    key: Key,
    value: Key extends A ? string[] : string,
  ) => void
  setFilters: (updates: Partial<FiltersState<K, A>>) => void
  resetFilters: () => void
  hasActiveFilters: boolean
  /** Ready to spread into Orval list hooks: `{ page, page_size, ...nonEmptyFilters }`. */
  queryParams: QueryParamsState<K, A>
}

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : fallback
}

/** Reads repeated (`?k=a&k=b`) and comma-separated (`?k=a,b`) query values. */
export function readArrayParam(searchParams: URLSearchParams, key: string): string[] {
  return searchParams
    .getAll(key)
    .flatMap((value) => value.split(','))
    .map((part) => part.trim())
    .filter(Boolean)
}

function writeArrayParam(params: URLSearchParams, key: string, values: string[]): void {
  params.delete(key)
  for (const value of values) {
    const trimmed = value.trim()
    if (trimmed) {
      params.append(key, trimmed)
    }
  }
}

function writeStringParam(params: URLSearchParams, key: string, value: string): void {
  if (value) {
    params.set(key, value)
  } else {
    params.delete(key)
  }
}

function isActiveFilterValue(value: FilterValue): boolean {
  return Array.isArray(value) ? value.length > 0 : Boolean(value)
}

export function useListParams<K extends string = never, A extends string = never>({
  filterKeys = [] as unknown as readonly K[],
  arrayFilterKeys = [] as unknown as readonly A[],
  defaultPageSize = 20,
  syncToUrl = true,
  resetPageOnFilterChange = true,
}: UseListParamsOptions<K, A> = {}): ListParams<K, A> {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = syncToUrl ? parsePositiveInt(searchParams.get(PAGE_KEY), 1) : 1
  const pageSize = syncToUrl
    ? parsePositiveInt(searchParams.get(PAGE_SIZE_KEY), defaultPageSize)
    : defaultPageSize

  const arrayKeySet = useMemo(() => new Set<string>(arrayFilterKeys), [arrayFilterKeys])

  const filters = useMemo(() => {
    const next = {} as FiltersState<K, A>
    for (const key of filterKeys) {
      ;(next as Record<string, string>)[key] = syncToUrl ? (searchParams.get(key) ?? '') : ''
    }
    for (const key of arrayFilterKeys) {
      ;(next as Record<string, string[]>)[key] = syncToUrl
        ? readArrayParam(searchParams, key)
        : []
    }
    return next
  }, [arrayFilterKeys, filterKeys, searchParams, syncToUrl])

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

  const applyFilterValue = useCallback(
    (params: URLSearchParams, key: string, value: FilterValue) => {
      if (arrayKeySet.has(key)) {
        writeArrayParam(params, key, Array.isArray(value) ? value : value ? [value] : [])
        return
      }
      writeStringParam(params, key, Array.isArray(value) ? value.join(',') : value)
    },
    [arrayKeySet],
  )

  const setFilter = useCallback(
    <Key extends K | A>(key: Key, value: Key extends A ? string[] : string) => {
      if (!syncToUrl) return
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          applyFilterValue(next, key, value as FilterValue)
          if (resetPageOnFilterChange) {
            next.delete(PAGE_KEY)
          }
          return next
        },
        { replace: true },
      )
    },
    [applyFilterValue, resetPageOnFilterChange, setSearchParams, syncToUrl],
  )

  const setFilters = useCallback(
    (updates: Partial<FiltersState<K, A>>) => {
      if (!syncToUrl) return
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const key of [...filterKeys, ...arrayFilterKeys]) {
            const value = updates[key as K | A]
            if (value === undefined) continue
            applyFilterValue(next, key, value as FilterValue)
          }
          if (resetPageOnFilterChange) {
            next.delete(PAGE_KEY)
          }
          return next
        },
        { replace: true },
      )
    },
    [
      applyFilterValue,
      arrayFilterKeys,
      filterKeys,
      resetPageOnFilterChange,
      setSearchParams,
      syncToUrl,
    ],
  )

  const resetFilters = useCallback(() => {
    const cleared = {} as Partial<FiltersState<K, A>>
    for (const key of filterKeys) {
      ;(cleared as Record<string, string>)[key] = ''
    }
    for (const key of arrayFilterKeys) {
      ;(cleared as Record<string, string[]>)[key] = []
    }
    setFilters(cleared)
  }, [arrayFilterKeys, filterKeys, setFilters])

  const hasActiveFilters = useMemo(
    () =>
      [...filterKeys, ...arrayFilterKeys].some((key) =>
        isActiveFilterValue(filters[key as K | A] as FilterValue),
      ),
    [arrayFilterKeys, filterKeys, filters],
  )

  const queryParams = useMemo(() => {
    const picked = {
      page,
      page_size: pageSize,
    } as QueryParamsState<K, A>

    for (const key of filterKeys) {
      const value = filters[key]
      if (value) {
        ;(picked as Record<string, string>)[key] = value
      }
    }
    for (const key of arrayFilterKeys) {
      const value = filters[key]
      if (value.length > 0) {
        ;(picked as Record<string, string[]>)[key] = value
      }
    }

    return picked
  }, [arrayFilterKeys, filterKeys, filters, page, pageSize])

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
