import { PublishWorkspace } from "./PublishWorkspace"
import { useExtensionSession } from "./useExtensionSession"

export function Facebook() {
  const { session, selectOrg } = useExtensionSession()

  if (session.status !== 'ready') {
    return null
  }

  return (
    <PublishWorkspace
      session={{ ...session, status: 'ready' }}
      onSelectOrg={async (organizationId) => {
        const response = await selectOrg(organizationId)
        if (!response.ok) throw new Error(response.error)
      }}
    />
  )
}