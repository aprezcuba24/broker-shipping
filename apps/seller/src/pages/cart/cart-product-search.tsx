import {
  useListProductsProductsSellerGet,
  type ListProductsProductsSellerGetParams,
  type ProductPublic,
} from '@broker/api'
import { Button, EntityAutocomplete, Input } from '@broker/ui'
import { Plus } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { useCart } from '@/hooks/use-cart'
import type { CartProductSnapshot } from '@/stores/cart-store'

function toCartSnapshot(product: ProductPublic): CartProductSnapshot {
  return {
    id: product.id,
    name: product.name,
    organization_id: product.organization_id,
    image_url: product.image_url,
    has_commission: product.has_commission,
    price: product.price,
    sale_price: product.sale_price,
  }
}

function renderProductOption(product: ProductPublic) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="truncate font-medium">{product.name}</span>
      <span className="truncate text-xs text-muted-foreground">
        {product.public_code}
      </span>
    </div>
  )
}

export function CartProductSearch() {
  const { sellerOrgId, addProductWithQuantity } = useCart()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<ProductPublic | null>(
    null,
  )
  const [quantity, setQuantity] = useState(1)
  const [autocompleteKey, setAutocompleteKey] = useState(0)

  const trimmedSearch = search.trim()
  const productsQuery = useListProductsProductsSellerGet(
    {
      page: 1,
      page_size: 20,
      name: trimmedSearch || undefined,
    } as ListProductsProductsSellerGetParams,
    {
      query: {
        enabled: Boolean(sellerOrgId) && trimmedSearch.length >= 1,
      },
    },
  )

  const items = productsQuery.data?.items ?? []

  const selectedLabel = useMemo(() => {
    if (!selectedProduct) return undefined
    return `${selectedProduct.name} (${selectedProduct.public_code})`
  }, [selectedProduct])

  const handleSearchChange = useCallback((query: string) => {
    setSearch(query)
  }, [])

  const handleValueChange = useCallback((value: string) => {
    setSelectedId(value)
    if (!value) {
      setSelectedProduct(null)
    }
  }, [])

  const handleItemSelect = useCallback((product: ProductPublic) => {
    setSelectedProduct(product)
  }, [])

  const handleQuantityChange = (raw: string) => {
    if (raw === '') {
      setQuantity(1)
      return
    }
    const parsed = Number.parseInt(raw, 10)
    if (Number.isNaN(parsed)) return
    setQuantity(Math.max(1, parsed))
  }

  const canAdd = Boolean(sellerOrgId && selectedProduct)

  const handleAdd = () => {
    if (!selectedProduct || !sellerOrgId) return
    addProductWithQuantity(toCartSnapshot(selectedProduct), quantity)
    setSelectedId('')
    setSelectedProduct(null)
    setSearch('')
    setQuantity(1)
    setAutocompleteKey((key) => key + 1)
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1 space-y-1.5">
        <label
          htmlFor="cart-product-search"
          className="text-sm font-medium leading-none"
        >
          Buscar producto
        </label>
        <EntityAutocomplete
          key={autocompleteKey}
          id="cart-product-search"
          items={items}
          value={selectedId || undefined}
          selectedLabel={selectedLabel}
          onValueChange={handleValueChange}
          onItemSelect={handleItemSelect}
          onSearchChange={handleSearchChange}
          renderItem={renderProductOption}
          isLoading={productsQuery.isFetching}
          placeholder="Buscar por nombre o código…"
          minQueryMessage="Escribe para buscar"
          emptyMessage="No se encontraron productos."
          disabled={!sellerOrgId}
          aria-label="Buscar por nombre o código"
        />
      </div>
      <div className="w-full space-y-1.5 sm:w-24">
        <label
          htmlFor="cart-product-quantity"
          className="text-sm font-medium leading-none"
        >
          Cantidad
        </label>
        <Input
          id="cart-product-quantity"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={quantity}
          onChange={(event) => handleQuantityChange(event.target.value)}
          disabled={!sellerOrgId}
          aria-label="Cantidad a añadir"
        />
      </div>
      <Button
        type="button"
        size="default"
        icon={Plus}
        label="Añadir"
        onClick={handleAdd}
        disabled={!canAdd}
        className="w-full sm:w-auto"
      />
    </div>
  )
}
