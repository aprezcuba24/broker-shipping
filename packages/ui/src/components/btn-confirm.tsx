import * as React from 'react'

import { Button, type ButtonProps } from './button'
import { ConfirmDialog, type ConfirmDialogProps } from './confirm-dialog'

export type BtnConfirmProps = {
  confirmVariant?: ConfirmDialogProps['variant']
  onConfirm: () => void | Promise<void>
  open?: boolean
  onOpenChange?: (open: boolean) => void
} & Omit<ConfirmDialogProps, 'open' | 'onOpenChange' | 'onConfirm' | 'variant'> &
  Omit<ButtonProps, 'onClick'>

export function BtnConfirm({
  open,
  onOpenChange,
  onConfirm,
  confirmVariant = 'default',
  ...props
}: BtnConfirmProps) {
  const {
    title,
    description,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    isLoading = false,
    ...buttonProps
  } = props

  const isControlled = open !== undefined
  const [internalOpen, setInternalOpen] = React.useState(false)

  const currentOpen = isControlled ? open : internalOpen
  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      onOpenChange?.(nextOpen)
      if (!isControlled) setInternalOpen(nextOpen)
    },
    [isControlled, onOpenChange],
  )

  const handleConfirm = React.useCallback(async () => {
    if (isLoading) return
    try {
      await onConfirm()
      setOpen(false)
    } catch {
      // Error del handler: mantener el diálogo abierto
    }
  }, [isLoading, onConfirm, setOpen])

  return (
    <>
      <Button type="button" {...buttonProps} onClick={() => setOpen(true)} />
      <ConfirmDialog
        open={currentOpen}
        onOpenChange={setOpen}
        {...{
          title,
          description,
          confirmLabel,
          cancelLabel,
          variant: confirmVariant,
          isLoading,
          onConfirm: handleConfirm,
        }}
      />
    </>
  )
}
