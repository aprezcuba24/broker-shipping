import { DataTable, PageWrapper } from '@broker/ui'
import { Plus, Tags } from 'lucide-react'
import { DialogForm } from './DialogForm'
import { columns } from './columns'
import { useCategories } from './categories-context'

export function CategoryTable() {
  const {
    formError,
    createFormKey,
    isCreating,
    submitCreate,
    resetCreateForm,
    items,
    isLoading,
    page,
    setPage,
  } = useCategories()

  return (
    <PageWrapper
      title="Categorías"
      description="Gestiona las categorías de productos de tu organización."
      icon={Tags}
      buttons={[
        <DialogForm
          key="create"
          label="Nueva categoría"
          icon={Plus}
          size="sm"
          className="w-full sm:w-auto"
          title="Nueva categoría"
          acceptLabel="Crear"
          defaultValues={{ name: '' }}
          formKey={String(createFormKey)}
          onSubmit={submitCreate}
          isSubmitting={isCreating}
          error={formError}
          onOpenChange={(open) => {
            if (!open) resetCreateForm()
          }}
        />,
      ]}
    >
      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        getRowId={(row) => row.id!}
        pagination={{ page, onPageChange: setPage }}
        emptyMessage="No hay categorías registradas"
      />
    </PageWrapper>
  )
}
