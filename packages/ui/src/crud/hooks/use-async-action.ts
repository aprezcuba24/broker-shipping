import { formatApiError } from '@broker/api'
import { useCallback, useRef, useState } from 'react'

import { notify } from '../../lib/notify'

export type AsyncAction<TArgs extends unknown[], TResult = void> = {
  run: (...args: TArgs) => Promise<TResult>
  isPending: boolean
  error: string | null
  clearError: () => void
}

export type AsyncActionToastOptions<TResult, TArgs extends unknown[]> = {
  success?: string | ((result: TResult, ...args: TArgs) => string | undefined)
  /** When true, also show a toast for errors (default: false — keep inline form errors). */
  error?: boolean
}

export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  onSuccess?: (result: TResult, ...args: TArgs) => void | Promise<void>,
  onError?: (error: unknown, ...args: TArgs) => string,
  toastOptions?: AsyncActionToastOptions<TResult, TArgs>,
): AsyncAction<TArgs, TResult> {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const actionRef = useRef(action)
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  const toastOptionsRef = useRef(toastOptions)

  actionRef.current = action
  onSuccessRef.current = onSuccess
  onErrorRef.current = onError
  toastOptionsRef.current = toastOptions

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const run = useCallback(async (...args: TArgs) => {
    setIsPending(true)
    setError(null)
    try {
      const result = await actionRef.current(...args)
      await onSuccessRef.current?.(result, ...args)
      const toastOpts = toastOptionsRef.current
      if (toastOpts?.success !== undefined) {
        const message =
          typeof toastOpts.success === 'function'
            ? toastOpts.success(result, ...args)
            : toastOpts.success
        if (message) {
          notify.success(message)
        }
      }
      return result
    } catch (caught) {
      const message = onErrorRef.current?.(caught, ...args) ?? formatApiError(caught)
      setError(message)
      if (toastOptionsRef.current?.error) {
        notify.error(caught, message)
      }
      throw caught
    } finally {
      setIsPending(false)
    }
  }, [])

  return { run, isPending, error, clearError }
}
