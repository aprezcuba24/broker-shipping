import {
  listFacebookGroupsFacebookGroupsGet,
  type FacebookGroupPublic,
  type ListFacebookGroupsFacebookGroupsGetParams,
} from '@broker/api'
import {
  BtnLink,
  Button,
  PageWrapper,
  useActiveOrganization,
} from '@broker/ui'
import { ArrowLeft, Play, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'

import { startFacebookPublish } from '../../lib/facebook-extension'
import {
  getSelectedMessageCount,
  getSelectedMessages,
  useFacebookPublishStore,
} from '../../stores/facebook-publish-store'

async function fetchAllFacebookGroups(): Promise<FacebookGroupPublic[]> {
  const all: FacebookGroupPublic[] = []
  let page = 1
  let total = Number.POSITIVE_INFINITY

  while (all.length < total) {
    const result = await listFacebookGroupsFacebookGroupsGet({
      page,
      page_size: 100,
    } as ListFacebookGroupsFacebookGroupsGetParams)
    total = result.total
    all.push(...result.items)
    if (result.items.length === 0) break
    page += 1
  }

  return all
}

export function AdsMessagePublishGroupsPage() {
  const { activeOrganization } = useActiveOrganization()
  const messages = useFacebookPublishStore((state) => state.messages)
  const selectedCount = getSelectedMessageCount(messages)
  const selectedMessages = useMemo(() => getSelectedMessages(messages), [messages])

  const [groups, setGroups] = useState<FacebookGroupPublic[]>([])
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  const loadGroups = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const items = await fetchAllFacebookGroups()
      setGroups(items)
      setSelectedGroupIds(new Set(items.map((group) => group.id)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los grupos')
      setGroups([])
      setSelectedGroupIds(new Set())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadGroups()
  }, [loadGroups, activeOrganization?.id])

  if (selectedCount === 0) {
    return <Navigate to="/ads-messages" replace />
  }

  function toggleGroup(groupId: string) {
    setSelectedGroupIds((current) => {
      const next = new Set(current)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  function toggleAll(checked: boolean) {
    setSelectedGroupIds(checked ? new Set(groups.map((group) => group.id)) : new Set())
  }

  async function handleStart() {
    const selectedGroups = groups
      .filter((group) => selectedGroupIds.has(group.id))
      .map((group) => ({
        id: group.id,
        name: group.name,
        url: group.facebook_id,
      }))

    setStarting(true)
    try {
      const result = await startFacebookPublish({
        adsMessages: selectedMessages,
        groups: selectedGroups,
      })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      if (result.via === 'window' && result.warned) {
        toast.warning(
          'Se abrieron los grupos, pero la extensión no recibió la selección. Instálala o configura VITE_FACEBOOK_EXTENSION_ID.',
        )
        return
      }
      toast.success('Publicación iniciada. Revisa las pestañas de Facebook.')
    } finally {
      setStarting(false)
    }
  }

  const selectedGroupCount = selectedGroupIds.size
  const allSelected = groups.length > 0 && selectedGroupCount === groups.length

  return (
    <PageWrapper
      title="Publicar en Facebook"
      description={`Elige los grupos donde publicarás ${selectedCount} anuncio${selectedCount === 1 ? '' : 's'}.`}
      icon={Users}
      buttons={[
        <BtnLink key="back" to="/ads-messages" variant="outline" icon={ArrowLeft}>
          Atrás
        </BtnLink>,
        <Button
          key="start"
          icon={Play}
          label="Comenzar"
          disabled={selectedGroupCount === 0 || loading || starting}
          isLoading={starting}
          onClick={() => void handleStart()}
        />,
      ]}
    >
      <div className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando grupos…</p>
        ) : groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay grupos. Agrégalos en Grupos de Facebook.
          </p>
        ) : (
          <div className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest">
            <label className="flex items-center gap-3 border-b border-outline-variant/20 px-4 py-3 text-sm font-medium">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={allSelected}
                onChange={(event) => toggleAll(event.target.checked)}
              />
              <span>
                Todos los grupos ({selectedGroupCount}/{groups.length})
              </span>
            </label>
            <ul className="divide-y divide-outline-variant/15">
              {groups.map((group) => (
                <li key={group.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm hover:bg-surface-container-low/60">
                    <input
                      type="checkbox"
                      className="size-4 accent-primary"
                      checked={selectedGroupIds.has(group.id)}
                      onChange={() => toggleGroup(group.id)}
                    />
                    <span className="min-w-0 flex-1 font-medium text-on-surface">
                      {group.name}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
