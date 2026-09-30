import type { Money, ProductPublic } from '@broker/api'

import { Badge } from '../components/ui/badge'
import { cn } from '../lib/utils'

export type SellerProductPriceBadgeKind =
  | 'needs_sale_price'
  | 'stale_sale_price'

/** Fields required to decide seller price badges. */
export type SellerProductPriceBadgeProduct = {
  has_commission: boolean
  price: Money
  sale_price?: Money | null
}

export function getSellerProductPriceBadgeKind(
  product: SellerProductPriceBadgeProduct,
): SellerProductPriceBadgeKind | null {
  if (
    product.sale_price != null &&
    product.price.amount >= product.sale_price.amount
  ) {
    return 'stale_sale_price'
  }
  if (product.has_commission === false && product.sale_price == null) {
    return 'needs_sale_price'
  }
  return null
}

const BADGE_COPY: Record<
  SellerProductPriceBadgeKind,
  { label: string; variant: 'secondary' | 'destructive'; className?: string }
> = {
  needs_sale_price: {
    label: 'Define tu precio',
    variant: 'secondary',
    className:
      'border-transparent bg-amber-400 text-amber-950 shadow hover:bg-amber-400/90',
  },
  stale_sale_price: {
    label: 'Precio desactualizado',
    variant: 'destructive',
  },
}

export type SellerProductPriceBadgeProps = {
  product: SellerProductPriceBadgeProduct | ProductPublic
  className?: string
}

export function SellerProductPriceBadge({
  product,
  className,
}: SellerProductPriceBadgeProps) {
  const kind = getSellerProductPriceBadgeKind(product)
  if (kind == null) return null

  const { label, variant, className: kindClassName } = BADGE_COPY[kind]
  return (
    <Badge variant={variant} className={cn(kindClassName, className)}>
      {label}
    </Badge>
  )
}
