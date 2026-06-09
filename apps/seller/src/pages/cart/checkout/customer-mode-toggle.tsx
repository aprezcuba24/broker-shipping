import { Button, cn } from '@broker/ui'
import type { CheckoutMode } from '@/hooks/use-checkout-order'

type CustomerModeToggleProps = {
  mode: CheckoutMode
  onModeChange: (mode: CheckoutMode) => void
  disabled?: boolean
}

export function CustomerModeToggle({
  mode,
  onModeChange,
  disabled,
}: CustomerModeToggleProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant={mode === 'new' ? 'default' : 'outline'}
        size="sm"
        disabled={disabled}
        className={cn(mode === 'new' && 'pointer-events-none')}
        onClick={() => onModeChange('new')}
      >
        Nuevo cliente
      </Button>
      <Button
        type="button"
        variant={mode === 'existing' ? 'default' : 'outline'}
        size="sm"
        disabled={disabled}
        className={cn(mode === 'existing' && 'pointer-events-none')}
        onClick={() => onModeChange('existing')}
      >
        Cliente existente
      </Button>
    </div>
  )
}
