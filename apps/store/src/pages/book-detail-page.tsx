import { useGetProductStorefrontProductsProductIdGet } from '@broker/api'
import { Button, formatMoney } from '@broker/ui'
import { Link, useParams } from 'react-router-dom'

import { BookCover } from '@/components/book-cover'
import { PayOnDeliveryNote } from '@/components/pay-on-delivery-note'
import { SaleFlow } from '@/components/sale-flow'
import { SELLER_ORGANIZATION_ID } from '@/config/env'
import { useCartStore } from '@/stores/cart-store'

export function BookDetailPage() {
  const { productId = '' } = useParams()
  const addBook = useCartStore((state) => state.addBook)
  const quantityInCart = useCartStore(
    (state) =>
      state.items.find((item) => item.book.id === productId)?.quantity ?? 0,
  )

  const bookQuery = useGetProductStorefrontProductsProductIdGet(productId, {
    organization_id: SELLER_ORGANIZATION_ID,
  })

  if (bookQuery.isLoading) {
    return <p className="py-16 text-center text-[color:var(--ink-muted)]">Cargando…</p>
  }

  if (bookQuery.isError || !bookQuery.data) {
    return (
      <div className="space-y-4 py-10 text-center">
        <p className="text-destructive">No encontramos este libro.</p>
        <Button asChild variant="outline">
          <Link to="/">Volver al estante</Link>
        </Button>
      </div>
    )
  }

  const book = bookQuery.data
  const author =
    book.tags?.map((tag) => tag.name).join(' · ') || 'Autor desconocido'
  const soldOut = book.stock <= 0
  const canAdd = !soldOut && quantityInCart < book.stock

  return (
    <div className="space-y-8">
      <div className="grid gap-8 md:grid-cols-[minmax(0,16rem)_1fr] lg:grid-cols-[minmax(0,18rem)_1fr]">
        <div className="mx-auto w-full max-w-[16rem] overflow-hidden rounded-sm shadow-lg ring-1 ring-[color:var(--border)]">
          <BookCover title={book.name} imageUrl={book.image_url} />
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.16em] text-[color:var(--spine-soft)]">
              {author}
            </p>
            <h2 className="font-display mt-1 text-3xl font-semibold text-[color:var(--ink)]">
              {book.name}
            </h2>
            <p className="mt-3 font-display text-2xl text-[color:var(--spine)]">
              {formatMoney(book.price)}
            </p>
            <p className="mt-1 text-sm text-[color:var(--ink-muted)]">
              {soldOut
                ? 'Sin existencias'
                : book.stock === 1
                  ? '1 ejemplar disponible'
                  : `${book.stock} ejemplares disponibles`}
            </p>
          </div>

          {book.description ? (
            <p className="max-w-2xl text-base leading-relaxed text-[color:var(--ink)]">
              {book.description}
            </p>
          ) : null}

          <PayOnDeliveryNote />

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              disabled={!canAdd}
              onClick={() => addBook(book, 1)}
            >
              {soldOut
                ? 'Agotado'
                : quantityInCart > 0
                  ? 'Añadir otro al carrito'
                  : 'Añadir al carrito'}
            </Button>
            {quantityInCart > 0 ? (
              <Button asChild variant="outline">
                <Link to="/carrito">Ver carrito ({quantityInCart})</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <SaleFlow compact />
    </div>
  )
}
