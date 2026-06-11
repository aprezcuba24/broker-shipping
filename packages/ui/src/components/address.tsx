import type { AddressDetail } from '@broker/api'

export function AddressShow({ address }: { address: AddressDetail }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        {address.address}, {address.municipality}, {address.district}, {address.neighborhood},{' '}
        {address.province}
      </div>
      {address.is_active ? (
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          Activa
        </span>
      ) : null}
    </div>
  )
}
