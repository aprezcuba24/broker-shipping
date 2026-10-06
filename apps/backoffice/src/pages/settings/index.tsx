import { PlatformProductCode } from '@broker/api'
import {
  PageWrapper,
  SettingsOptionCard,
  useOrganizationPlatformProducts,
} from '@broker/ui'
import { Settings, Truck } from 'lucide-react'

export function SettingsPage() {
  const { hasProduct, isLoading } = useOrganizationPlatformProducts()
  const showMessaging =
    !isLoading && hasProduct(PlatformProductCode.provider_management)

  return (
    <PageWrapper
      title="Configurar"
      description="Ajustes de tu organización de proveedor."
      icon={Settings}
    >
      <div className="mx-auto grid max-w-2xl gap-3 sm:grid-cols-1">
        {showMessaging ? (
          <SettingsOptionCard
            to="/settings/messaging"
            title="Precio mensajería"
            description="Define el costo de mensajería por barrio y si aceptas barrios sin precio."
            icon={Truck}
          />
        ) : !isLoading ? (
          <p className="text-sm text-muted-foreground">
            No hay ajustes disponibles para los productos habilitados en esta
            organización.
          </p>
        ) : null}
      </div>
    </PageWrapper>
  )
}
