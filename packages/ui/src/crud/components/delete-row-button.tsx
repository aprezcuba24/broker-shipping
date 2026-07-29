import { Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'

import { BtnConfirm, type BtnConfirmProps } from '../../components/btn-confirm'

export type DeleteRowButtonProps = Omit<
  BtnConfirmProps,
  'onConfirm' | 'confirmVariant' | 'title' | 'description'
> & {
  onDelete: () => unknown | Promise<unknown>
  title?: string
  description?: string
  itemLabel?: string
  children?: ReactNode
}

export function DeleteRowButton({
  onDelete,
  title = 'Eliminar',
  description,
  itemLabel,
  confirmLabel = 'Eliminar',
  variant = 'ghost',
  size = 'icon',
  'aria-label': ariaLabel = 'Eliminar',
  children,
  ...buttonProps
}: DeleteRowButtonProps) {
  const resolvedDescription =
    description ??
    (itemLabel
      ? `¿Seguro que deseas eliminar «${itemLabel}»? Esta acción no se puede deshacer.`
      : '¿Seguro que deseas eliminar este registro? Esta acción no se puede deshacer.')

  return (
    <BtnConfirm
      type="button"
      variant={variant}
      size={size}
      aria-label={ariaLabel}
      title={title}
      description={resolvedDescription}
      confirmLabel={confirmLabel}
      confirmVariant="destructive"
      onConfirm={async () => {
        await onDelete()
      }}
      {...buttonProps}
    >
      {children ?? <Trash2 className="h-4 w-4 text-destructive" />}
    </BtnConfirm>
  )
}
