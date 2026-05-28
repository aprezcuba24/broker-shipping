import type { Category } from '@broker/api'
import { BtnConfirm, BtnList, type ColumnDef } from '@broker/ui'
import { Pencil, Trash2 } from 'lucide-react'
import { DialogForm } from './DialogForm'
import { useCategories } from './categories-context'

function RowActions({ category }: { category: Category }) {
  const {
    submitEdit,
    clearFormError,
    isSubmitting,
    formError,
    deleteItem,
    isDeleting,
  } = useCategories()

  return (
    <BtnList>
      <DialogForm
        icon={Pencil}
        label=""
        variant="ghost"
        size="icon"
        aria-label={`Editar ${category.name}`}
        title="Editar categoría"
        acceptLabel="Guardar"
        defaultValues={{ name: category.name }}
        formKey={category.id}
        onSubmit={(values) => submitEdit(category, values)}
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
        aria-label={`Eliminar ${category.name}`}
        title="Eliminar categoría"
        description={`¿Seguro que deseas eliminar «${category.name}»? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        confirmVariant="destructive"
        onConfirm={() => deleteItem(category)}
        isLoading={isDeleting}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </BtnConfirm>
    </BtnList>
  )
}

export const columns: ColumnDef<Category>[] = [
  { id: 'name', header: 'Nombre', accessor: 'name' },
  { id: 'created_at', header: 'Creado', accessor: 'created_at' },
  { id: 'updated_at', header: 'Actualizado', accessor: 'updated_at' },
  {
    id: 'actions',
    header: '',
    align: 'right',
    cell: (row) => <RowActions category={row} />,
  },
]
