import {
  useListProductsStorefrontProductsGet,
  useListTagsStorefrontTagsGet,
} from '@broker/api'
import { useEffect, useMemo, useState } from 'react'

import { BookCard } from '@/components/book-card'
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

  return (
    <>
      <section className="store-hero">
        <div>
          <h1>Elige tu libro. Págalo cuando llegue a tus manos.</h1>
          <p>
            Arma tu pedido, avísanos por WhatsApp y coordinamos la entrega. Sin
            pagos por adelantado: primero recibes, después pagas.
          </p>
        </div>
        <aside className="store-ticket" aria-label="Cómo funciona">
          <h2>Así de simple</h2>
          <ol>
            <li>
              <span>1</span>
              <div>
                <strong>Elige tus libros</strong>
                Agrégalos al carrito.
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Registra tu pedido</strong>
                Déjanos tu nombre y dirección.
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Confirma por WhatsApp</strong>
                Hablas directo con el vendedor.
              </div>
            </li>
            <li className="pay">
              <span>$</span>
              <div>
                <strong>Pagas al recibir</strong>
                El pago es contra entrega.
              </div>
            </li>
          </ol>
        </aside>
      </section>

      <div className="store-tools">
        <input
          className="store-search"
          type="search"
          value={search}
          placeholder="Buscar por título o autor"
          aria-label="Buscar libros"
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="store-tag-select"
          value={tagId}
          aria-label="Filtrar por etiqueta"
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

      <section className="store-grid" aria-live="polite">
        {productsQuery.isLoading ? (
          <p className="store-empty">Cargando libros…</p>
        ) : productsQuery.isError ? (
          <p className="store-empty" style={{ color: 'var(--err)' }}>
            No se pudo cargar el catálogo.
          </p>
        ) : books.length === 0 ? (
          <p className="store-empty">
            No encontramos libros con esa búsqueda. Prueba con otro título o
            autor.
          </p>
        ) : (
          books.map((book) => <BookCard key={book.id} book={book} />)
        )}
      </section>
    </>
  )
}
