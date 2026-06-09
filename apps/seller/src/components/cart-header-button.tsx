import { cn } from '@broker/ui'
import { ShoppingCart } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { selectCartSummary, useCartStore } from '@/stores/cart-store'

export function CartHeaderButton() {
  const itemCount = useCartStore((state) => selectCartSummary(state).itemCount)
  const [isPulsing, setIsPulsing] = useState(false)
  const isInitialMount = useRef(true)

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    setIsPulsing(true)
  }, [itemCount])

  const handleAnimationEnd = () => {
    setIsPulsing(false)
  }

  return (
    <Link
      to="/cart"
      className="relative p-2 rounded-full hover:bg-surface-container-highest/50 transition-colors"
      aria-label={`Carrito, ${itemCount} productos`}
    >
      <span
        className={cn('inline-flex', isPulsing && 'animate-cart-pulse')}
        onAnimationEnd={handleAnimationEnd}
      >
        <ShoppingCart className="h-[18px] w-[18px] text-on-surface-variant" />
      </span>
      {itemCount > 0 ? (
        <span
          className={cn(
            'absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ds-primary px-1 text-[10px] font-bold leading-none text-on-primary',
            isPulsing && 'animate-cart-pulse',
          )}
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      ) : null}
    </Link>
  )
}
