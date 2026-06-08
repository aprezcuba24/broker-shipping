import { createLocalStorageAuthStorage } from '@broker/api'

export const sellerAuthStorage = createLocalStorageAuthStorage(
  'broker:seller:token',
)
