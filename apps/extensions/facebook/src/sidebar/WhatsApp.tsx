import { PublishWorkspace, type PublishResult } from './PublishWorkspace'
import { useExtensionSession } from './useExtensionSession'

const HINTS = {
  queue: 'Pulsa Publicar en cada anuncio para enviarlo por WhatsApp.',
  catalog: 'Mensajes preparados para publicar en WhatsApp.',
} as const

export function WhatsApp() {
  const { session, selectOrg } = useExtensionSession()

  if (session.status !== 'ready') {
    return null
  }

  async function onPublish(adMessageId: string): Promise<PublishResult> {
    console.log('[Vendelo360 WhatsApp] publish', adMessageId)
    return { ok: true, status: null }
  }

  return (
    <PublishWorkspace
      session={{ ...session, status: 'ready' }}
      hints={HINTS}
      onPublish={onPublish}
      onSelectOrg={async (organizationId) => {
        const response = await selectOrg(organizationId)
        if (!response.ok) throw new Error(response.error)
      }}
    />
  )
}
