import * as React from 'react'

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
  onAccept?: () => void
  onCancel?: () => void
  isLoading?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
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
    [isControlled, onOpenChange]
  )

  const handleAccept = React.useCallback(() => {
    if (isLoading) return
    onAccept?.()
    setOpen(false)
  }, [isLoading, onAccept, setOpen])

  const handleCancel = React.useCallback(() => {
    if (isLoading) return
    onCancel?.()
  }, [isLoading, onCancel])

  return (
    <Dialog open={currentOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button {...buttonProps} />
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {children}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
              {cancelLabel}
            </Button>
          </DialogClose>

          <Button onClick={handleAccept} disabled={isLoading}>
            {isLoading ? 'Procesando…' : acceptLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
