import { createLocalStorageAuthStorage } from '@broker/api'

export const adminAuthStorage = createLocalStorageAuthStorage('broker:admin:token')
