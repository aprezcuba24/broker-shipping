import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

import { ToastContext } from '@/components/store-toast-context'

export function StoreToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<number | null>(null)

  const showToast = useCallback((next: string) => {
    setMessage(next)
    setVisible(true)
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setVisible(false), 1800)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <ToastContext value={{ showToast }}>
      {children}
      <div
        className={`store-toast${visible ? ' show' : ''}`}
        role="status"
        aria-live="polite"
      >
        {message}
      </div>
    </ToastContext>
  )
}
