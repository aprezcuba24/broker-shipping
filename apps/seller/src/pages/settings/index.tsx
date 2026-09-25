import { PageWrapper } from '@broker/ui'
import { Settings } from 'lucide-react'

import { WhatsAppExtensionSection } from './whatsapp-extension-section'

export function SettingsPage() {
  return (
    <PageWrapper
      title="Configurar"
      description="Ajustes de tu espacio de vendedor e integraciones."
      icon={Settings}
    >
      <div className="mx-auto max-w-2xl space-y-8">
        <WhatsAppExtensionSection />
      </div>
    </PageWrapper>
  )
}
