import { useGetProductStorefrontProductsProductIdGet } from '@broker/api'
import { formatMoney } from '@broker/ui'
import { Link, useParams } from 'react-router-dom'

import { BookCover } from '@/components/book-cover'
import { BookDescription } from '@/components/book-description'
import { PayOnDeliveryNote } from '@/components/pay-on-delivery-note'
import { useStoreToast } from '@/hooks/use-store-toast'
import { SELLER_ORGANIZATION_ID } from '@/config/env'
import { useCartStore } from '@/stores/cart-store'

export function BookDetailPage() {
  const { productId = '' } = useParams()
  const addBook = useCartStore((state) => state.addBook)
  const quantityInCart = useCartStore(
    (state) =>
      state.items.find((item) => item.book.id === productId)?.quantity ?? 0,
  )
  const { showToast } = useStoreToast()

  const bookQuery = useGetProductStorefrontProductsProductIdGet(productId, {
    organization_id: SELLER_ORGANIZATION_ID,
  })

  if (bookQuery.isLoading) {
    return <p className="store-empty">Cargando…</p>
  }

  if (bookQuery.isError || !bookQuery.data) {
    return (
      <div className="store-empty" style={{ display: 'grid', gap: '1rem' }}>
        <p style={{ color: 'var(--err)', margin: 0 }}>
          No encontramos este libro.
        </p>
        <div>
          <Link to="/" className="store-btn ghost">
            Volver al catálogo
          </Link>
        </div>
      </div>
    )
  }

  const book = bookQuery.data
  const author =
    book.tags?.map((tag) => tag.name).join(' · ') || 'Autor desconocido'
  const soldOut = book.stock <= 0
  const canAdd = !soldOut && quantityInCart < book.stock

  return (
    <div className="store-detail">
      <div className="store-detail-cover">
        <BookCover
          title={book.name}
          author={author}
          imageUrl={book.image_url}
        />
      </div>

      <div className="store-detail-body">
        <div>
          <p className="store-detail-author">{author}</p>
          <h1 className="store-detail-title">{book.name}</h1>
          <p className="store-price">{formatMoney(book.price)}</p>
          <p className="store-detail-stock">
            {soldOut
              ? 'Sin existencias'
              : book.stock === 1
                ? '1 ejemplar disponible'
                : `${book.stock} ejemplares disponibles`}
          </p>
        </div>

        {book.description ? (
          <BookDescription markdown={book.description} />
        ) : null}

        <PayOnDeliveryNote>
          El vendedor te lleva el libro a casa. Pagas cuando lo recibas, no
          antes.
        </PayOnDeliveryNote>

        <div className="store-detail-actions">
          <button
            type="button"
            className="store-btn"
            disabled={!canAdd}
            onClick={() => {
              addBook(book, 1)
              showToast('Agregado al carrito')
            }}
          >
            {soldOut
              ? 'Agotado'
              : quantityInCart > 0
                ? 'Añadir otro al carrito'
                : 'Agregar al carrito'}
          </button>
          {quantityInCart > 0 ? (
            <Link to="/carrito" className="store-btn ghost">
              Ver carrito ({quantityInCart})
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
