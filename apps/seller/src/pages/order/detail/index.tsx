import { Button, PageWrapper } from '@broker/ui'
import { ClipboardList } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

export function OrderDetailPage() {
  const { orderId = '' } = useParams()

  return (
    <PageWrapper
      title={`Orden ${orderId}`}
      description="Detalle de la orden"
      icon={ClipboardList}
      buttons={[
        <Button key="back" variant="outline" size="sm" asChild>
          <Link to="/">Volver al inicio</Link>
        </Button>,
      ]}
    >
      <p className="text-sm text-muted-foreground">Detalle de orden — próximamente.</p>
    </PageWrapper>
  )
}
