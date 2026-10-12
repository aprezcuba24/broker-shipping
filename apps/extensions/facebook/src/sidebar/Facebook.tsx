import { sendMessage } from '../auth/messaging'
import { PublishWorkspace, type PublishResult } from './PublishWorkspace'
import { useExtensionSession } from './useExtensionSession'

const HINTS = {
  queue: 'Pulsa Publicar en cada anuncio para abrir el diálogo de Facebook.',
  catalog: 'Mensajes preparados para publicar en Facebook.',
} as const

export function Facebook() {
  const { session, selectOrg } = useExtensionSession()

  if (session.status !== 'ready') {
    return null
  }

  async function onPublish(adMessageId: string): Promise<PublishResult> {
    const response = await sendMessage({
      type: 'FILL_AD_MESSAGE',
      payload: { adMessageId },
    })
    if (!response.ok) {
      return { ok: false, error: response.error }
    }
    if ('filled' in response && response.filled) {
      return {
        ok: true,
        status: 'Diálogo listo. Revisa y pulsa Publicar en Facebook.',
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
