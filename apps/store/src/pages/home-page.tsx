import {
  useListProductsStorefrontProductsGet,
  useListTagsStorefrontTagsGet,
} from '@broker/api'
import { useEffect, useMemo, useState } from 'react'

import { BookCard } from '@/components/book-card'
import { SaleFlow } from '@/components/sale-flow'
import { SELLER_ORGANIZATION_ID } from '@/config/env'

export function HomePage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [tagId, setTagId] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 280)
    return () => window.clearTimeout(timer)
  }, [search])

  const tagsQuery = useListTagsStorefrontTagsGet({
    organization_id: SELLER_ORGANIZATION_ID,
    page_size: 100,
  })

  const productsQuery = useListProductsStorefrontProductsGet({
    organization_id: SELLER_ORGANIZATION_ID,
    page_size: 48,
    name: debouncedSearch || undefined,
    tag_id: tagId || undefined,
  })

  const books = productsQuery.data?.items ?? []
  const tags = useMemo(
    () => tagsQuery.data?.items ?? [],
    [tagsQuery.data?.items],
  )

  const shelfLabel = useMemo(() => {
    if (tagId) {
      const tag = tags.find((item) => item.id === tagId)
      return tag ? `Estante · ${tag.name}` : 'Estante'
    }
    if (debouncedSearch) return `Buscando “${debouncedSearch}”`
    return 'Estante'
  }, [debouncedSearch, tagId, tags])

  return (
    <div className="space-y-8">
      <SaleFlow />

      <section aria-labelledby="shelf-title" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--gilt)]">
              Catálogo
            </p>
            <h2
              id="shelf-title"
              className="font-display text-2xl font-semibold text-[color:var(--ink)]"
            >
              {shelfLabel}
            </h2>
          </div>
          <div className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row">
            <input
              type="search"
              value={search}
              placeholder="Buscar por título"
              className="h-10 flex-1 rounded-md border border-input bg-white/80 px-3 text-sm"
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              value={tagId}
              className="h-10 rounded-md border border-input bg-white/80 px-3 text-sm sm:max-w-[12rem]"
              onChange={(event) => setTagId(event.target.value)}
            >
              <option value="">Todos los autores</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="shelf-rail h-2 rounded-sm" aria-hidden />

        {productsQuery.isLoading ? (
          <p className="py-10 text-center text-[color:var(--ink-muted)]">
            Cargando libros…
          </p>
        ) : productsQuery.isError ? (
          <p className="py-10 text-center text-destructive">
            No se pudo cargar el catálogo.
          </p>
        ) : books.length === 0 ? (
          <p className="py-10 text-center text-[color:var(--ink-muted)]">
            No hay libros en este estante por ahora.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
