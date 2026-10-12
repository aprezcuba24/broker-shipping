import { sendMessage } from '../auth/messaging'
import { PublishWorkspace, type PublishResult } from './PublishWorkspace'
import { useExtensionSession } from './useExtensionSession'

const HINTS = {
  queue: 'Abre el chat o grupo y pulsa Publicar para pegar imagen y texto.',
  catalog: 'Mensajes preparados para WhatsApp. Abre el chat o grupo y publícalos desde la cola.',
} as const

export function WhatsApp() {
  const { session, selectOrg } = useExtensionSession()

  if (session.status !== 'ready') {
    return null
  }

  async function onPublish(adMessageId: string): Promise<PublishResult> {
    const response = await sendMessage({
      type: 'FILL_WHATSAPP_AD',
      payload: { adMessageId },
    })
    if (!response.ok) {
      return { ok: false, error: response.error }
    }
    if ('filled' in response && response.filled) {
      return {
        ok: true,
        status: 'Imagen y texto listos. Revisa y pulsa Enviar.',
      }
    }
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
