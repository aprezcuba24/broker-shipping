import * as React from 'react'

import { cn } from '../lib/utils'
import { Button, type ButtonProps } from './button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'

export type ButtonModalProps = {
  title: string
  cancelLabel?: string
  acceptLabel?: string
  onAccept?: () => void | Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** When true, no trigger button is rendered (for externally controlled modals). */
  hideTrigger?: boolean
  children: React.ReactNode
} & Omit<ButtonProps, 'children' | 'onClick'>

export function ButtonModal({
  title,
  cancelLabel = 'Cancelar',
  acceptLabel = 'Aceptar',
  onAccept,
  onCancel,
  isLoading = false,
  open,
  onOpenChange,
  hideTrigger = false,
  children,
  ...buttonProps
}: ButtonModalProps) {
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

  const handleAccept = React.useCallback(async () => {
    if (isLoading) return
    try {
      await onAccept?.()
      setOpen(false)
    } catch {
      // Validación o error del handler: mantener el modal abierto
    }
  }, [isLoading, onAccept, setOpen])

  const handleCancel = React.useCallback(() => {
    if (isLoading) return
    onCancel?.()
  }, [isLoading, onCancel])

  return (
    <Dialog open={currentOpen} onOpenChange={setOpen}>
      {!hideTrigger ? (
        <DialogTrigger asChild>
          <Button {...buttonProps} />
        </DialogTrigger>
      ) : null}

      <DialogContent className="broker-dialog">
        <DialogHeader>
          <DialogTitle className="font-headline">{title}</DialogTitle>
        </DialogHeader>

        {children}

        <DialogFooter className="broker-dialog-footer">
          <DialogClose asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
          </DialogClose>

          <Button
            size="sm"
            className="w-full sm:w-auto"
            onClick={handleAccept}
            disabled={isLoading}
          >
            {isLoading ? 'Procesando…' : acceptLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
