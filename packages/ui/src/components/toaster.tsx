import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      className="broker-toaster"
      toastOptions={{
        classNames: {
          toast: 'broker-toast',
          title: 'broker-toast-title',
          description: 'broker-toast-description',
          actionButton: 'broker-toast-action',
          cancelButton: 'broker-toast-cancel',
          closeButton: 'broker-toast-close',
        },
      }}
    />
  )
}
