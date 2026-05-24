export type Organization = {
  id: string
  name: string
  created_at: string
  updated_at: string | null
}

const organizationNames = [
  'Acme Brokerage',
  'Andes Capital',
  'Atlas Seguros',
  'Boreal Finanzas',
  'Cumbre Inversiones',
  'Delta Corredores',
  'Eclipse Holdings',
  'Fénix Partners',
  'Granite Asset',
  'Horizonte Mutual',
  'Ícaro Wealth',
  'Jade Brokers',
  'Kronos Trading',
  'Lumen Advisors',
  'Meridiano FX',
  'Nova Capital',
  'Órbita Seguros',
  'Pioneer Markets',
  'Quasar Finance',
  'Río Norte Broker',
  'Sierra Capital',
  'Titan Securities',
  'Umbra Investments',
  'Vértice Global',
  'Zenith Brokers',
]

function daysAgo(days: number, hour = 10, minute = 0): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

export const mockOrganizations: Organization[] = organizationNames.map(
  (name, index) => {
    const createdDaysAgo = 120 - index * 4
    const hasUpdate = index % 3 !== 0

    return {
      id: `org-${String(index + 1).padStart(3, '0')}`,
      name,
      created_at: daysAgo(createdDaysAgo, 9 + (index % 6), index % 60),
      updated_at: hasUpdate
        ? daysAgo(createdDaysAgo - 2, 14 + (index % 4), (index * 7) % 60)
        : null,
    }
  }
)
