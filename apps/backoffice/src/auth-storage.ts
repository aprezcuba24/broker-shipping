import { createLocalStorageAuthStorage } from '@broker/api'

export const backofficeAuthStorage = createLocalStorageAuthStorage(
  'broker:backoffice:token',
)
