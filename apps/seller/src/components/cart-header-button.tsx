import { BtnLink } from '@broker/ui'
import { ShoppingCart } from 'lucide-react'

import { useCart } from '@/hooks/use-cart'

export function CartHeaderButton() {
  const { totalItems } = useCart()

  return (
    <div className="relative">
      <BtnLink
        to="/cart"
        variant="ghost"
        size="icon-sm"
        icon={ShoppingCart}
        aria-label={
          totalItems > 0
            ? `Carrito, ${totalItems} unidad${totalItems === 1 ? '' : 'es'}`
            : 'Carrito'
        }
      />
      {totalItems > 0 ? (
        <span className="pointer-events-none absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ds-primary px-1 text-[10px] font-bold leading-none text-on-primary">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      ) : null}
    </div>
  )
}
