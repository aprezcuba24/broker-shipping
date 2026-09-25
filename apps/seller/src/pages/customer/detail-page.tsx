import {
  formatAddressLine,
  formatDateTime,
  useGetCustomerCustomersSellerCustomerIdGet,
  type CustomerPublic,
  type GetCustomerCustomersSellerCustomerIdGetParams,
} from '@broker/api'
import {
  asPurchaseTier,
  BtnLink,
  DetailSection,
  PageLoading,
  PageMessage,
  PageWrapper,
  PhoneReputation,
  type DetailSectionField,
} from '@broker/ui'
import { ArrowLeft, ClipboardList, Contact } from 'lucide-react'
import { useParams } from 'react-router-dom'

const customerDetailFields: DetailSectionField<CustomerPublic>[] = [
  {
    title: 'Nombre',
    accessor: (customer) => customer.name,
  },
  {
    title: 'CI',
    accessor: (customer) => customer.ci,
  },
  {
    title: 'Teléfono',
    accessor: (customer) => customer.phone,
  },
]

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
  const addresses = customer.addresses ?? []

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
        <DetailSection title="Datos" data={customer} fields={customerDetailFields} />

        <section className="space-y-3">
          <h2 className="text-sm font-medium">Calificación</h2>
          <div className="rounded-xl border border-border/70 bg-surface-container-lowest px-4 py-3 sm:px-5">
            <PhoneReputation
              phone={customer.phone}
              tier={asPurchaseTier(customer.purchase_tier)}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium">Direcciones</h2>
          {addresses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin direcciones registradas.</p>
          ) : (
            <ul className="divide-y divide-border/60 rounded-xl border border-border/70 bg-surface-container-lowest">
              {addresses.map((address) => (
                <li
                  key={address.id}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 sm:px-5"
                >
                  <span className="text-sm">{formatAddressLine(address)}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {formatDateTime(address.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageWrapper>
  )
}
