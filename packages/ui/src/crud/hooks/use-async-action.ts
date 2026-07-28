import { formatApiError } from '@broker/api'
import { useCallback, useRef, useState } from 'react'

export type UseAsyncActionOptions<TArgs extends unknown[], TResult> = {
  onSuccess?: (result: TResult, ...args: TArgs) => void | Promise<void>
  onError?: (error: unknown, ...args: TArgs) => void
  fallbackErrorMessage?: string
}

export type AsyncAction<TArgs extends unknown[], TResult = void> = {
  run: (...args: TArgs) => Promise<TResult>
  isPending: boolean
  error: string | null
  clearError: () => void
}

export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  options: UseAsyncActionOptions<TArgs, TResult> = {},
): AsyncAction<TArgs, TResult> {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const actionRef = useRef(action)
  const optionsRef = useRef(options)

  actionRef.current = action
  optionsRef.current = options

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const run = useCallback(async (...args: TArgs) => {
    setIsPending(true)
    setError(null)
    try {
      const result = await actionRef.current(...args)
      await optionsRef.current.onSuccess?.(result, ...args)
      return result
    } catch (caught) {
      const message = formatApiError(caught, optionsRef.current.fallbackErrorMessage)
      setError(message)
      optionsRef.current.onError?.(caught, ...args)
      throw caught
    } finally {
      setIsPending(false)
    }
  }, [])

  return { run, isPending, error, clearError }
}
