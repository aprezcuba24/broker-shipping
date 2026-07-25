import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'

type UseResetOnChangeOptions = {
  resetOnChange?: readonly unknown[]
  getQueryKey?: () => QueryKey
  onReset?: () => void
  setPage?: (page: number) => void
}

export function useResetOnChange({
  resetOnChange,
  getQueryKey,
  onReset,
  setPage,
}: UseResetOnChangeOptions) {
  const queryClient = useQueryClient()
  const resetKey = useMemo(() => JSON.stringify(resetOnChange ?? []), [resetOnChange])
  const prevResetKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (resetOnChange === undefined) return
    if (prevResetKeyRef.current === null) {
      prevResetKeyRef.current = resetKey
      return
    }
    if (prevResetKeyRef.current === resetKey) return
    prevResetKeyRef.current = resetKey

    onReset?.()
    setPage?.(1)
    if (getQueryKey !== undefined) {
      void queryClient.invalidateQueries({ queryKey: getQueryKey() })
    }
  }, [resetKey, resetOnChange, getQueryKey, onReset, setPage, queryClient])
}
