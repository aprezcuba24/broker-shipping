import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import { buttonVariants } from './ui/button'
import { cn } from '../lib/utils'

export type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  isLoading?: boolean
  variant?: 'destructive' | 'default'
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  isLoading = false,
  variant = 'default',
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="broker-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-headline">{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="broker-dialog-footer">
          <AlertDialogCancel
            disabled={isLoading}
            className={cn(buttonVariants({ size: 'sm' }), 'w-full sm:w-auto')}
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading}
            className={cn(
              buttonVariants({
                size: 'sm',
                variant: variant === 'destructive' ? 'destructive' : 'default',
              }),
              'w-full sm:w-auto',
            )}
            onClick={(event) => {
              event.preventDefault()
              onConfirm()
            }}
          >
            {isLoading ? 'Procesando…' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
