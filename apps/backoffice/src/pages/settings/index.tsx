import { PageWrapper, SettingsOptionCard } from '@broker/ui'
import { Settings, Truck } from 'lucide-react'

export function SettingsPage() {
  return (
    <PageWrapper
      title="Configurar"
      description="Ajustes de tu organización de proveedor."
      icon={Settings}
    >
      <div className="mx-auto grid max-w-2xl gap-3 sm:grid-cols-1">
        <SettingsOptionCard
          to="/settings/messaging"
          title="Precio mensajería"
          description="Define el costo de mensajería por barrio y si aceptas barrios sin precio."
          icon={Truck}
        />
      </div>
    </PageWrapper>
  )
}
