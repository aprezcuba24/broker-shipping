import {
  Button,
  ConfirmDialog,
  formatPriceCents,
  PageWrapper,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@broker/ui'
import { ClipboardCheck } from 'lucide-react'
import { FormProvider } from 'react-hook-form'
import { Navigate } from 'react-router-dom'
import { type CheckoutMode, useCheckoutOrder } from '@/hooks/use-checkout-order'
import { useCartStore } from '@/stores/cart-store'
import { ExistingCustomerCheckout } from './existing-customer-checkout'
import { NewCustomerCheckout } from './new-customer-checkout'

export function CartCheckoutPage() {
  const lines = useCartStore((state) => state.lines)
  const total = useCartStore((state) => state.lines.reduce((sum, line) => sum + line.line_total, 0))

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
              <span className="text-sm font-medium text-foreground">Total a pagar</span>
              <span className="text-lg font-semibold tabular-nums">{formatPriceCents(total)}</span>
            </div>
          </section>

          <Tabs value={mode} onValueChange={(value) => setMode(value as CheckoutMode)}>
            <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-grid">
              <TabsTrigger value="new" disabled={isSubmitting}>
                Nuevo cliente
              </TabsTrigger>
              <TabsTrigger value="existing" disabled={isSubmitting}>
                Cliente existente
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new">
              <NewCustomerCheckout control={form.control} />
            </TabsContent>
            <TabsContent value="existing">
              <ExistingCustomerCheckout
                control={form.control}
                selectedCustomer={selectedCustomer}
                onCustomerSelect={handleCustomerSelect}
              />
            </TabsContent>
          </Tabs>

          {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

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
