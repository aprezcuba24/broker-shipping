import type { StorefrontProductPublic } from '@broker/api'
import { formatMoney } from '@broker/ui'
import { Link } from 'react-router-dom'

import { BookCover } from '@/components/book-cover'
import { useStoreToast } from '@/hooks/use-store-toast'
import { useCartStore } from '@/stores/cart-store'

function authorLabel(book: StorefrontProductPublic): string {
  if (!book.tags?.length) return 'Autor desconocido'
  return book.tags.map((tag) => tag.name).join(' · ')
}

function descriptionPreview(description: string | null | undefined): string {
  if (!description) return 'Sin descripción.'
  const plain = description
    .replace(/[`#>*_~[\]()!-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (plain.length <= 110) return plain
  return `${plain.slice(0, 107).trimEnd()}…`
}

export function BookCard({ book }: { book: StorefrontProductPublic }) {
  const addBook = useCartStore((state) => state.addBook)
  const quantityInCart = useCartStore(
    (state) =>
      state.items.find((item) => item.book.id === book.id)?.quantity ?? 0,
  )
  const { showToast } = useStoreToast()
  const soldOut = book.stock <= 0
  const canAdd = !soldOut && quantityInCart < book.stock
  const author = authorLabel(book)

  return (
    <article className="store-card">
      <Link to={`/libros/${book.id}`} style={{ display: 'block', color: 'inherit' }}>
        <BookCover
          title={book.name}
          author={author}
          imageUrl={book.image_url}
        />
      </Link>
      <div className="store-info">
        <Link
          to={`/libros/${book.id}`}
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          <h3>{book.name}</h3>
        </Link>
        <small>
          {author}
          {soldOut ? ' · Agotado' : ''}
        </small>
        <p>{descriptionPreview(book.description)}</p>
        <div className="store-buy">
          <span className="store-price">{formatMoney(book.price)}</span>
          <button
            type="button"
            className="store-btn"
            disabled={!canAdd}
            onClick={() => {
              addBook(book, 1)
              showToast('Agregado al carrito')
            }}
          >
            {soldOut ? 'Agotado' : 'Agregar'}
          </button>
        </div>
      </div>
    </article>
  )
}
