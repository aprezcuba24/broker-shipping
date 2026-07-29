import { formatApiError } from '@broker/api'
import { useCallback, useRef, useState } from 'react'

export type AsyncAction<TArgs extends unknown[], TResult = void> = {
  run: (...args: TArgs) => Promise<TResult>
  isPending: boolean
  error: string | null
  clearError: () => void
}

export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  onSuccess?: (result: TResult, ...args: TArgs) => void | Promise<void>,
  onError?: (error: unknown, ...args: TArgs) => string,
): AsyncAction<TArgs, TResult> {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const actionRef = useRef(action)
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)

  actionRef.current = action
  onSuccessRef.current = onSuccess
  onErrorRef.current = onError

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const run = useCallback(async (...args: TArgs) => {
    setIsPending(true)
    setError(null)
    try {
      const result = await actionRef.current(...args)
      await onSuccessRef.current?.(result, ...args)
      return result
    } catch (caught) {
      const message = onErrorRef.current?.(caught, ...args) ?? formatApiError(caught)
      setError(message)
      throw caught
    } finally {
      setIsPending(false)
    }
  }, [])

  return { run, isPending, error, clearError }
}
