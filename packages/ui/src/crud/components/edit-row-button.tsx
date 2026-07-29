import { Pencil } from 'lucide-react'

import { Button, type ButtonProps } from '../../components/button'

export type EditRowButtonProps = Omit<ButtonProps, 'children' | 'onClick'> & {
  onEdit: () => void
  label?: string
}

export function EditRowButton({
  onEdit,
  label = '',
  icon = Pencil,
  variant = 'ghost',
  size = 'icon',
  'aria-label': ariaLabel = 'Editar',
  ...buttonProps
}: EditRowButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      icon={icon}
      label={label}
      aria-label={ariaLabel}
      onClick={onEdit}
      {...buttonProps}
    />
  )
}
