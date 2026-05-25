function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function formatApiError(
  error: unknown,
  fallback = 'Ha ocurrido un error. Inténtalo de nuevo.',
): string {
  if (typeof error === 'string') {
    return error
  }

  if (isRecord(error)) {
    const detail = error.detail
    if (typeof detail === 'string') {
      return detail
    }
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (!isRecord(item)) return null
          const msg = item.msg
          return typeof msg === 'string' ? msg : null
        })
        .filter((msg): msg is string => msg !== null)
      if (messages.length > 0) {
        return messages.join('. ')
      }
    }
    if (typeof error.message === 'string') {
      return error.message
    }
  }

  return fallback
}
