import type { FacebookGroup, GroupsConfig } from '../auth/types'

export async function loadGroupsConfig(): Promise<FacebookGroup[]> {
  const url = chrome.runtime.getURL('config/groups.json')
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('No se pudo cargar config/groups.json')
  }
  const data = (await response.json()) as GroupsConfig
  if (!Array.isArray(data.groups)) {
    throw new Error('config/groups.json inválido')
  }
  return data.groups.filter(
    (g) => typeof g.name === 'string' && typeof g.url === 'string' && g.url,
  )
}
