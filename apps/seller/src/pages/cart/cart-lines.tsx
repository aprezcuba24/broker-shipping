import { formatPriceCents, useSellerLinkedProviders } from '@broker/ui'
import { ProductCartAction } from '@/components/product-cart-action'
import type { CartLine } from '@/stores/cart-store'

function CartLineProviderName({ providerId }: { providerId: string }) {
  const { getProviderName } = useSellerLinkedProviders()
  return <span className="text-xs text-muted-foreground">{getProviderName(providerId)}</span>
}

export function CartLines({ lines }: { lines: CartLine[] }) {
  return (
    <section className="space-y-3">
      <ul className="divide-y divide-border border-t-2">
        {lines.map((line) => (
          <li
            key={line.product_id}
            className="grid gap-3 py-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center md:gap-4"
          >
            <div className="min-w-0 space-y-0.5">
              <p className="font-medium text-foreground">{line.product.name}</p>
              <CartLineProviderName providerId={line.provider_organization_id} />
            </div>

            <div className="flex items-center justify-between gap-2 md:justify-end">
              <span className="text-xs text-muted-foreground md:hidden">Precio unitario</span>
              <span className="text-sm tabular-nums">{formatPriceCents(line.price)}</span>
            </div>

            <div className="flex items-center justify-between gap-2 md:justify-center">
              <span className="text-xs text-muted-foreground md:hidden">Cantidad</span>
              <ProductCartAction product={line.product} />
            </div>

            <div className="flex items-center justify-between gap-2 md:justify-end">
              <span className="text-xs text-muted-foreground md:hidden">Total línea</span>
              <span className="text-sm font-medium tabular-nums">
                {formatPriceCents(line.line_total)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
