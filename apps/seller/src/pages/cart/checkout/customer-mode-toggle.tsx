import { Tabs, TabsList, TabsTrigger } from '@broker/ui'
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
    <Tabs
      value={mode}
      onValueChange={(value) => onModeChange(value as CheckoutMode)}
    >
      <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-grid">
        <TabsTrigger value="new" disabled={disabled}>
          Nuevo cliente
        </TabsTrigger>
        <TabsTrigger value="existing" disabled={disabled}>
          Cliente existente
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
