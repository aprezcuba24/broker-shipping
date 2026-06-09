import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  formatPriceCents,
  PageWrapper,
} from '@broker/ui'
import { ClipboardCheck } from 'lucide-react'
import { FormProvider } from 'react-hook-form'
import { Navigate } from 'react-router-dom'
import { useCheckoutOrder } from '@/hooks/use-checkout-order'
import { useCartStore } from '@/stores/cart-store'
import { AddressForm } from './address-form'
import { AddressPicker } from './address-picker'
import { CustomerForm } from './customer-form'
import { CustomerModeToggle } from './customer-mode-toggle'
import { ExistingCustomerPicker } from './existing-customer-picker'

export function CartCheckoutPage() {
  const lines = useCartStore((state) => state.lines)
  const total = useCartStore((state) =>
    state.lines.reduce((sum, line) => sum + line.line_total, 0),
  )

  const {
    form,
    mode,
    setMode,
    selectedCustomer,
    handleCustomerSelect,
    isSubmitting,
    submitError,
    isConfirmOpen,
    setIsConfirmOpen,
    handleConfirmOpenChange,
    validate,
    submitOrder,
  } = useCheckoutOrder()

  const customerId = form.watch('customerId')

  if (lines.length === 0) {
    return <Navigate to="/cart" replace />
  }

  const handleSendClick = async () => {
    const isValid = await validate()
    if (!isValid) return
    setIsConfirmOpen(true)
  }

  const handleConfirm = async () => {
    await submitOrder()
  }

  return (
    <PageWrapper title="Finalizar pedido" icon={ClipboardCheck}>
      <FormProvider {...form}>
        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Total a pagar
              </span>
              <span className="text-lg font-semibold tabular-nums">
                {formatPriceCents(total)}
              </span>
            </div>
          </section>

          <Card>
            <CardHeader className="space-y-3">
              <CardTitle className="text-base">Datos del cliente</CardTitle>
              <CustomerModeToggle
                mode={mode}
                onModeChange={setMode}
                disabled={isSubmitting}
              />
            </CardHeader>
            <CardContent>
              {mode === 'new' ? (
                <CustomerForm control={form.control} />
              ) : (
                <ExistingCustomerPicker
                  control={form.control}
                  selectedCustomer={selectedCustomer}
                  onCustomerSelect={handleCustomerSelect}
                />
              )}
            </CardContent>
          </Card>

          {mode === 'new' ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dirección de entrega</CardTitle>
              </CardHeader>
              <CardContent>
                <AddressForm control={form.control} />
              </CardContent>
            </Card>
          ) : customerId ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dirección de entrega</CardTitle>
              </CardHeader>
              <CardContent>
                <AddressPicker control={form.control} customerId={customerId} />
              </CardContent>
            </Card>
          ) : null}

          {submitError ? (
            <p className="text-sm text-destructive">{submitError}</p>
          ) : null}

          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={isSubmitting}
            onClick={() => void handleSendClick()}
          >
            Enviar orden
          </Button>

          <ConfirmDialog
            open={isConfirmOpen}
            onOpenChange={handleConfirmOpenChange}
            title="Confirmar pedido"
            description="¿Deseas enviar este pedido? Esta acción no se puede deshacer."
            confirmLabel="Enviar orden"
            cancelLabel="Cancelar"
            isLoading={isSubmitting}
            onConfirm={() => void handleConfirm()}
          />
        </div>
      </FormProvider>
    </PageWrapper>
  )
}
