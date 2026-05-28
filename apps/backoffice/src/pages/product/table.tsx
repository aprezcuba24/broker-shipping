import { DataTable, PageWrapper } from '@broker/ui'
import { Package, Plus } from 'lucide-react'
import { DialogForm } from './DialogForm'
import { columns } from './columns'
import { ProductFilters } from './filter'
import { useProducts } from './products-context'

export function ProductTable() {
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
  } = useProducts()

  return (
    <PageWrapper
      title="Catálogo"
      description="Gestiona los productos de tu organización."
      icon={Package}
      buttons={[
        <DialogForm
          key="create"
          label="Nuevo producto"
          icon={Plus}
          size="sm"
          className="w-full sm:w-auto"
          title="Nuevo producto"
          acceptLabel="Crear"
          defaultValues={{ name: '', category_id: '' }}
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
      <ProductFilters />
      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        getRowId={(row) => row.id!}
        pagination={{ page, onPageChange: setPage }}
        emptyMessage="No hay productos registrados"
      />
    </PageWrapper>
  )
}
