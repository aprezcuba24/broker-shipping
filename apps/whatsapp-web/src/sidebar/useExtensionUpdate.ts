import { useCallback, useEffect, useState } from 'react'
import { UPDATE_AVAILABLE_KEY } from '../auth/constants'
import { applyUpdate, getUpdateStatus } from '../auth/messaging'

export function useExtensionUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const response = await getUpdateStatus()
      if (!cancelled && response.ok) {
        setUpdateAvailable(response.updateAvailable)
      }
    })()

    const onChanged: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (
      changes,
      area,
    ) => {
      if (area !== 'local' || !changes[UPDATE_AVAILABLE_KEY]) return
      setUpdateAvailable(changes[UPDATE_AVAILABLE_KEY].newValue === true)
    }

    chrome.storage.onChanged.addListener(onChanged)
    return () => {
      cancelled = true
      chrome.storage.onChanged.removeListener(onChanged)
    }
  }, [])

  const reloadForUpdate = useCallback(async () => {
    setApplying(true)
    try {
      await applyUpdate()
    } catch {
      setApplying(false)
    }
  }, [])

  return { updateAvailable, applying, reloadForUpdate }
}
