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
import { Navigate } from 'react-router-dom'
import { useCheckoutOrder } from '@/hooks/use-checkout-order'
import { useCartStore } from '@/stores/cart-store'
import { AddressForm } from './address-form'
import { CustomerForm } from './customer-form'

export function CartCheckoutPage() {
  const lines = useCartStore((state) => state.lines)
  const total = useCartStore((state) =>
    state.lines.reduce((sum, line) => sum + line.line_total, 0),
  )

  const {
    form,
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
          <CardHeader>
            <CardTitle className="text-base">Datos del cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerForm control={form.control} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dirección de entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <AddressForm control={form.control} />
          </CardContent>
        </Card>

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
          description="¿Deseas enviar este pedido al cliente? Esta acción no se puede deshacer."
          confirmLabel="Enviar orden"
          cancelLabel="Cancelar"
          isLoading={isSubmitting}
          onConfirm={() => void handleConfirm()}
        />
      </div>
    </PageWrapper>
  )
}
