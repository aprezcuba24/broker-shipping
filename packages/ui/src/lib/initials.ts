export function initialsFromUsername(username: string): string {
  const trimmed = username.trim()
  if (!trimmed) return '?'
  return trimmed.slice(0, 2).toUpperCase()
}
