import { use } from 'react'

import { ToastContext } from '@/components/store-toast-context'

export function useStoreToast() {
  const value = use(ToastContext)
  if (!value) {
    throw new Error('useStoreToast must be used within StoreToastProvider')
  }
  return value
}
