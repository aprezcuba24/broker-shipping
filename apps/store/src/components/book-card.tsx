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
      className="group flex flex-col gap-3 outline-none transition"
    >
      <div className="book-object relative transition duration-200 group-hover:-translate-y-1 group-hover:shadow-[var(--shadow-lift)] group-focus-visible:ring-2 group-focus-visible:ring-[color:var(--spine)]/40">
        <BookCover title={book.name} imageUrl={book.image_url} />
        {soldOut ? (
          <span className="absolute inset-x-0 bottom-0 z-[3] bg-[color:var(--ink)]/85 px-2 py-1.5 text-center text-[0.65rem] uppercase tracking-[0.12em] text-[color:var(--paper-raised)]">
            Agotado
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 px-0.5">
        <p className="font-italic text-[0.8rem] leading-snug text-[color:var(--ink-muted)]">
          {authorLabel(book)}
        </p>
        <h3 className="font-display text-[0.95rem] font-semibold leading-snug text-[color:var(--ink)] transition-colors group-hover:text-[color:var(--spine)] sm:text-base">
          {book.name}
        </h3>
        <p className="mt-auto pt-1.5 font-display text-base text-[color:var(--spine)]">
          {formatMoney(book.price)}
        </p>
      </div>
    </Link>
  )
}
