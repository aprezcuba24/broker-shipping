import { X } from 'lucide-react'

import { Button, type ButtonProps } from '../../components/button'

export type ClearFiltersButtonProps = Omit<ButtonProps, 'onClick' | 'children'> & {
  onClear: () => void
  label?: string
}

export function ClearFiltersButton({
  onClear,
  label = 'Limpiar',
  variant = 'ghost',
  size = 'sm',
  ...buttonProps
}: ClearFiltersButtonProps) {
  return (
    <Button type="button" variant={variant} size={size} icon={X} label={label} onClick={onClear} {...buttonProps} />
  )
}
