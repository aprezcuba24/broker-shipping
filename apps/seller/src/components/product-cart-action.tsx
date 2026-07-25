import { type Product } from '@broker/api'
import { Button } from '@broker/ui'
import { ShoppingCart, Trash2 } from 'lucide-react'
import { useCartStore } from '@/stores/cart-store'
import { QuantitySelector } from './quantity-selector'

export function ProductCartAction({ product }: { product: Product }) {
  const productId = product.id!
  const quantity = useCartStore(
    (state) => state.lines.find((line) => line.product_id === productId)?.quantity ?? 0,
  )
  const addProduct = useCartStore((state) => state.addProduct)
  const decreaseQuantity = useCartStore((state) => state.decreaseQuantity)
  const removeProduct = useCartStore((state) => state.removeProduct)

  if (quantity === 0) {
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Adicionar al carrito"
        onClick={() => addProduct(product)}
        className="bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
      >
        <ShoppingCart />
      </Button>
    )
  }

  return (
    <div className="inline-flex items-center gap-1">
      <QuantitySelector
        value={quantity}
        min={1}
        onChange={(newValue) => {
          if (newValue > quantity) {
            addProduct(product, newValue - quantity)
          } else if (newValue < quantity) {
            decreaseQuantity(productId, quantity - newValue)
          }
        }}
      />
      <Button
        variant="ghost"
        size="icon-sm"
        className="bg-destructive/10 text-destructive hover:bg-destructive/20 cursor-pointer"
        aria-label="Eliminar del carrito"
        onClick={() => removeProduct(productId)}
      >
        <Trash2 />
      </Button>
    </div>
  )
}
