import {
  useGetCustomerCustomersSellerCustomerIdGet,
  type GetCustomerCustomersSellerCustomerIdGetParams,
} from '@broker/api'
import {
  asPurchaseTier,
  BtnLink,
  CustomerProfileCard,
  PageLoading,
  PageMessage,
  PageWrapper,
  PhoneReputation,
} from '@broker/ui'
import { ArrowLeft, ClipboardList, Contact } from 'lucide-react'
import { useParams } from 'react-router-dom'

export function CustomerDetailPage() {
  const { customerId = '' } = useParams<{ customerId: string }>()

  const customerQuery = useGetCustomerCustomersSellerCustomerIdGet(
    customerId,
    {} as GetCustomerCustomersSellerCustomerIdGetParams,
    { query: { enabled: Boolean(customerId) } },
  )

  if (!customerId || customerQuery.isLoading) {
    return <PageLoading title="Cliente" />
  }

  if (customerQuery.isError || !customerQuery.data) {
    return (
      <PageMessage
        title="Cliente no encontrado"
        message="No se pudo cargar el cliente solicitado."
        icon={Contact}
        backTo="/customers"
      />
    )
  }

  const customer = customerQuery.data

  return (
    <PageWrapper
      title={customer.name}
      description="Detalle del cliente."
      icon={Contact}
      leading={
        <BtnLink
          to="/customers"
          variant="outline"
          size="icon-sm"
          icon={ArrowLeft}
          aria-label="Volver a clientes"
        />
      }
      buttons={[
        <BtnLink
          key="orders"
          to={`/orders?customer_id=${customer.id}`}
          variant="outline"
          size="sm"
          icon={ClipboardList}
        >
          Ver órdenes
        </BtnLink>,
      ]}
    >
      <div className="space-y-6">
        <CustomerProfileCard customer={customer} title="Datos">
          <section className="space-y-3">
            <h2 className="text-sm font-medium">Calificación</h2>
            <div className="rounded-xl border border-border/70 bg-surface-container-lowest px-4 py-3 sm:px-5">
              <PhoneReputation
                phone={customer.phone}
                tier={asPurchaseTier(customer.purchase_tier)}
              />
            </div>
          </section>
        </CustomerProfileCard>
      </div>
    </PageWrapper>
  )
}
