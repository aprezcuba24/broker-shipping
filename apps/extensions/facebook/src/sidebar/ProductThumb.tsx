import { useEffect, useState } from 'react'
import { sendMessage } from '../auth/messaging'

type Props = {
  url: string | null
}

/**
 * Loads product photos through the background worker.
 * WhatsApp Web CSP blocks direct CDN <img> URLs in the page; data: URLs work.
 */
export function ProductThumb({ url }: Props) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!url) {
      setSrc(null)
      return
    }

    let cancelled = false
    void (async () => {
      const response = await sendMessage({ type: 'FETCH_THUMBNAIL', url })
      if (cancelled) return
      if (response.ok && 'dataUrl' in response) {
        setSrc(response.dataUrl)
      } else {
        setSrc(null)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [url])

  if (!src) return <div className="product-thumb" />
  return <img className="product-thumb" src={src} alt="" />
}
