import { Button } from '@broker/ui'
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'

import { useCart } from '@/hooks/use-cart'
import {
  getCartQuantity,
  useCartStore,
  type CartProductSnapshot,
} from '@/stores/cart-store'

export type ProductCartControlProps = {
  product: CartProductSnapshot
}

export function ProductCartControl({ product }: ProductCartControlProps) {
  const { sellerOrgId, addProduct, increment, decrement, removeProduct } = useCart()

  const quantity = useCartStore((s) =>
    getCartQuantity(s.cartsByOrganization, sellerOrgId, product.id),
  )

  if (quantity === 0) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        icon={ShoppingCart}
        label=""
        aria-label={`Añadir ${product.name} al carrito`}
        onClick={() => addProduct(product)}
        disabled={!sellerOrgId}
      />
    )
  }

  return (
    <div className="inline-flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        icon={Minus}
        label=""
        aria-label={`Reducir cantidad de ${product.name}`}
        onClick={() => decrement(product.id)}
        disabled={quantity <= 1}
      />
      <span
        className="min-w-8 text-center text-sm font-medium tabular-nums"
        aria-live="polite"
        aria-label={`Cantidad de ${product.name}: ${quantity}`}
      >
        {quantity}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        icon={Plus}
        label=""
        aria-label={`Aumentar cantidad de ${product.name}`}
        onClick={() => increment(product.id)}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        icon={Trash2}
        label=""
        aria-label={`Eliminar ${product.name} del carrito`}
        onClick={() => removeProduct(product.id)}
      />
    </div>
  )
}
