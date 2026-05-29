import { useMemo } from 'react'
import {
  useListCategoriesProductsCategoriesGet,
  type Product,
} from '@broker/api'
import { BtnConfirm, BtnList, type ColumnDef } from '@broker/ui'
import { Pencil, Trash2 } from 'lucide-react'
import { DialogForm } from './DialogForm'
import { useProducts } from './products-context'

function CategoryName({ categoryId }: { categoryId: string }) {
  const { data: categories = [] } = useListCategoriesProductsCategoriesGet()
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  )

  return categoryMap.get(categoryId) ?? 'Sin categoría'
}

function RowActions({ product }: { product: Product }) {
  const {
    submitEdit,
    clearFormError,
    isSubmitting,
    formError,
    deleteItem,
    isDeleting,
  } = useProducts()

  return (
    <BtnList>
      <DialogForm
        icon={Pencil}
        label=""
        variant="ghost"
        size="icon"
        aria-label={`Editar ${product.name}`}
        title="Editar producto"
        acceptLabel="Guardar"
        defaultValues={{ name: product.name, category_id: product.category_id }}
        formKey={product.id}
        onSubmit={(values) => submitEdit(product, values)}
        isSubmitting={isSubmitting}
        error={formError}
        onOpenChange={(open) => {
          if (!open) clearFormError()
        }}
      />
      <BtnConfirm
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Eliminar ${product.name}`}
        title="Eliminar producto"
        description={`¿Seguro que deseas eliminar «${product.name}»? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        confirmVariant="destructive"
        onConfirm={() => deleteItem(product)}
        isLoading={isDeleting}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </BtnConfirm>
    </BtnList>
  )
}

export const columns: ColumnDef<Product>[] = [
  { id: 'name', header: 'Nombre', accessor: 'name' },
  {
    id: 'category_id',
    header: 'Categoría',
    cell: (row) => <CategoryName categoryId={row.category_id} />,
  },
  { id: 'created_at', header: 'Creado', accessor: 'created_at', type: 'datetime' },
  {
    id: 'updated_at',
    header: 'Actualizado',
    accessor: 'updated_at',
    type: 'datetime',
    hideOn: 'sm',
  },
  {
    id: 'actions',
    header: '',
    align: 'right',
    cell: (row) => <RowActions product={row} />,
  },
]
