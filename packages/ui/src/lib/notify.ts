import { formatApiError } from '@broker/api'
import { toast } from 'sonner'

export type EntityGender = 'm' | 'f'

function pastParticiple(base: 'cread' | 'actualizad' | 'eliminad', gender: EntityGender) {
  return `${base}${gender === 'f' ? 'a' : 'o'}`
}

export const notify = {
  success: (message: string) => {
    toast.success(message)
  },
  error: (error: unknown, fallback?: string) => {
    toast.error(formatApiError(error, fallback))
  },
  created: (entity: string, gender: EntityGender = 'm') => {
    toast.success(`${entity} ${pastParticiple('cread', gender)}`)
  },
  updated: (entity: string, gender: EntityGender = 'm') => {
    toast.success(`${entity} ${pastParticiple('actualizad', gender)}`)
  },
  deleted: (entity: string, gender: EntityGender = 'm') => {
    toast.success(`${entity} ${pastParticiple('eliminad', gender)}`)
  },
}
