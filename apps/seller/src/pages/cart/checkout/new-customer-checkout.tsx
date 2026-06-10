import { Card, CardContent, CardHeader, CardTitle } from '@broker/ui'
import type { Control } from 'react-hook-form'
import type { CheckoutOrderFormValues } from '@/hooks/use-checkout-order'
import { AddressForm } from './address-form'
import { CustomerForm } from './customer-form'

type NewCustomerCheckoutProps = {
  control: Control<CheckoutOrderFormValues>
}

export function NewCustomerCheckout({ control }: NewCustomerCheckoutProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm control={control} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dirección de entrega</CardTitle>
        </CardHeader>
        <CardContent>
          <AddressForm control={control} />
        </CardContent>
      </Card>
    </div>
  )
}
