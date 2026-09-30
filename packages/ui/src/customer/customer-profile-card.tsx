import {
  formatAddressLine,
  formatDateTime,
  type CustomerPublic,
} from '@broker/api'
import { type ReactNode } from 'react'

import {
  DetailSection,
  type DetailSectionField,
} from '../components/detail-section'

export type CustomerProfileCardProps = {
  customer: CustomerPublic | null | undefined
  title?: string
  children?: ReactNode
}

const customerProfileFields: DetailSectionField<CustomerPublic>[] = [
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
  {
    title: 'Dirección',
    accessor: (customer) => customer.address?.address,
    fullWidth: true,
  },
  {
    title: 'Provincia',
    accessor: (customer) => customer.address?.province_name,
  },
  {
    title: 'Municipio',
    accessor: (customer) => customer.address?.municipality_name,
  },
  {
    title: 'Barrio',
    accessor: (customer) => customer.address?.neighborhood_name,
  },
]

export function CustomerProfileCard({
  customer,
  title = 'Cliente',
  children,
}: CustomerProfileCardProps) {
  if (!customer) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="text-sm text-muted-foreground">Sin datos del cliente.</p>
      </section>
    )
  }

  const addresses = customer.addresses ?? []
  const showAddressHistory = addresses.length > 1

  return (
    <div className="space-y-6">
      <DetailSection title={title} data={customer} fields={customerProfileFields} />

      {children}

      {showAddressHistory ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Direcciones</h2>
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
        </section>
      ) : null}
    </div>
  )
}
