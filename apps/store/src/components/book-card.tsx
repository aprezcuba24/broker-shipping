import type { StorefrontProductPublic } from '@broker/api'
import { formatMoney } from '@broker/ui'
import { Link } from 'react-router-dom'

import { BookCover } from '@/components/book-cover'

function authorLabel(book: StorefrontProductPublic): string {
  if (!book.tags?.length) return 'Autor desconocido'
  return book.tags.map((tag) => tag.name).join(' · ')
}

export function BookCard({ book }: { book: StorefrontProductPublic }) {
  const soldOut = book.stock <= 0

  return (
    <Link
      to={`/libros/${book.id}`}
      className="group flex flex-col overflow-hidden rounded-sm bg-white/70 shadow-[0_10px_24px_rgba(28,20,16,0.12)] ring-1 ring-[color:var(--border)] transition hover:-translate-y-1 hover:shadow-[0_16px_28px_rgba(28,20,16,0.18)]"
    >
      <div className="relative overflow-hidden">
        <BookCover title={book.name} imageUrl={book.image_url} />
        {soldOut ? (
          <span className="absolute inset-x-0 bottom-0 bg-[color:var(--ink)]/80 px-2 py-1 text-center text-xs uppercase tracking-wide text-[color:var(--paper)]">
            Agotado
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 border-t border-[color:var(--border)] p-3">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[color:var(--spine-soft)]">
          {authorLabel(book)}
        </p>
        <h3 className="font-display text-base font-semibold leading-snug text-[color:var(--ink)] group-hover:text-[color:var(--spine)]">
          {book.name}
        </h3>
        <p className="mt-auto pt-2 font-display text-lg text-[color:var(--spine)]">
          {formatMoney(book.price)}
        </p>
      </div>
    </Link>
  )
}
