import { formatDateTime } from '@broker/api'
import {
  BtnConfirm,
  Button,
  DetailSection,
  formatPriceCents,
  PageLoading,
  PageMessage,
  PageWrapper,
} from '@broker/ui'
import { ArrowLeft, ClipboardList } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatOrderStatus, formatSnapshotValue } from '../order-labels'
import { OrderLines } from './lines'
import { useOrderDetail } from './use-order-detail'

export function OrderDetailPage() {
  const {
    order,
    isLoading,
    isError,
    backTo,
    canCancel,
    cancelError,
    handleCancel,
    isCanceling,
  } = useOrderDetail()

  if (isLoading) {
    return <PageLoading title="Orden" />
  }

  if (isError || !order) {
    return (
      <PageMessage
        title="Orden no encontrada"
        icon={ClipboardList}
        message="La orden no existe o no tienes acceso a ella."
        backTo={backTo}
        backLabel="Volver a órdenes"
      />
    )
  }

  const buttons = [
    <Button key="back" variant="outline" size="sm" asChild>
      <Link to={backTo}>
        <ArrowLeft className="h-4 w-4" />
        Volver a órdenes
      </Link>
    </Button>,
  ]
  if (canCancel) {
    buttons.push(
      <BtnConfirm
        key="cancel"
        label="Cancelar orden"
        variant="destructive"
        size="sm"
        className="w-full sm:w-auto"
        title="Cancelar orden"
        description={`¿Seguro que deseas cancelar la orden «${order.name}»? Esta acción no se puede deshacer.`}
        confirmLabel="Cancelar orden"
        confirmVariant="destructive"
        onConfirm={handleCancel}
        isLoading={isCanceling}
      />,
    )
  }

  return (
    <PageWrapper
      title={order.name}
      description="Detalle de la orden"
      icon={ClipboardList}
      buttons={buttons}
    >
      <div className="space-y-8">
        {cancelError && <p className="text-sm text-destructive">{cancelError}</p>}

        <DetailSection
          title="Resumen"
          data={order}
          fields={[
            { title: 'Código', accessor: (item) => item.name },
            {
              title: 'Estado',
              accessor: (item) => item.status,
              format: (value) => formatOrderStatus(value as typeof order.status),
            },
            {
              title: 'Total productos',
              accessor: (item) => item.product_price,
              format: (value) => formatPriceCents(value as number),
            },
            {
              title: 'Total orden',
              accessor: (item) => item.price,
              format: (value) => formatPriceCents(value as number),
            },
            {
              title: 'Creado',
              accessor: (item) => item.created_at,
              format: (value) => formatDateTime(value as string),
            },
            {
              title: 'Actualizado',
              accessor: (item) => item.updated_at,
              format: (value) => formatDateTime(value as string | null),
            },
          ]}
        />

        <DetailSection
          title="Cliente"
          data={order.customer_snapshot}
          fields={[
            { title: 'Nombre', accessor: (snapshot) => snapshot.name, format: formatSnapshotValue },
            { title: 'Teléfono', accessor: (snapshot) => snapshot.phone, format: formatSnapshotValue },
            {
              title: 'Identificación',
              accessor: (snapshot) => snapshot.identification,
              format: formatSnapshotValue,
            },
          ]}
        />

        <DetailSection
          title="Entrega"
          data={order.address_snapshot}
          fields={[
            { title: 'Provincia', accessor: (snapshot) => snapshot.province, format: formatSnapshotValue },
            {
              title: 'Municipio',
              accessor: (snapshot) => snapshot.municipality,
              format: formatSnapshotValue,
            },
            { title: 'Distrito', accessor: (snapshot) => snapshot.district, format: formatSnapshotValue },
            { title: 'Barrio', accessor: (snapshot) => snapshot.neighborhood, format: formatSnapshotValue },
            { title: 'Dirección', accessor: (snapshot) => snapshot.address, format: formatSnapshotValue },
            { title: 'Referencia', accessor: (snapshot) => snapshot.reference, format: formatSnapshotValue },
          ]}
        />

        <OrderLines lines={order.lines} />
      </div>
    </PageWrapper>
  )
}
