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
      return tag ? tag.name : 'Estante'
    }
    if (debouncedSearch) return `“${debouncedSearch}”`
    return 'En el estante'
  }, [debouncedSearch, tagId, tags])

  return (
    <div className="space-y-12">
      <SaleFlow />

      <section aria-labelledby="shelf-title" className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="shelf-title"
              className="font-display text-2xl font-semibold tracking-tight text-[color:var(--ink)] sm:text-[1.75rem]"
            >
              {shelfLabel}
            </h2>
            {!debouncedSearch && !tagId ? (
              <p className="mt-1 text-sm text-[color:var(--ink-muted)]">
                Libros de uso listos para llevar a casa
              </p>
            ) : null}
          </div>
          <div className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row">
            <input
              type="search"
              value={search}
              placeholder="Buscar por título"
              className="store-control flex-1"
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              value={tagId}
              className="store-control sm:max-w-[12rem]"
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

        {productsQuery.isLoading ? (
          <p className="py-16 text-center text-[color:var(--ink-muted)]">
            Cargando libros…
          </p>
        ) : productsQuery.isError ? (
          <p className="py-16 text-center text-destructive">
            No se pudo cargar el catálogo.
          </p>
        ) : books.length === 0 ? (
          <p className="py-16 text-center text-[color:var(--ink-muted)]">
            No hay libros en este estante por ahora.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
