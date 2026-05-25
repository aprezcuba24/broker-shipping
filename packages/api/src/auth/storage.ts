export type AuthStorage = {
  getToken: () => string | null
  setToken: (token: string | null) => void
}

export function createLocalStorageAuthStorage(key: string): AuthStorage {
  return {
    getToken: () => {
      try {
        return localStorage.getItem(key)
      } catch {
        return null
      }
    },
    setToken: (token) => {
      try {
        if (token) {
          localStorage.setItem(key, token)
        } else {
          localStorage.removeItem(key)
        }
      } catch {
        /* private browsing / disabled storage */
      }
    },
  }
}
