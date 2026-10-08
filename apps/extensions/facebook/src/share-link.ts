function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Build plain text for Facebook post: title + description.
 */
export function buildPostText(title: string, description: string): string {
  const lines: string[] = []
  
  const trimmedTitle = title.trim()
  if (trimmedTitle) {
    lines.push(trimmedTitle)
  }
  
  const trimmedDesc = description.trim()
  if (trimmedDesc && trimmedDesc !== trimmedTitle) {
    if (lines.length > 0) lines.push('')
    for (const part of trimmedDesc.split('\n')) {
      lines.push(part)
    }
  }
  
  return lines.join('\n')
}

/**
 * Build HTML for Facebook post: title in bold, description in divs.
 * Facebook keeps formatting when pasted as text/html.
 */
export function buildPostHtml(title: string, description: string): string {
  const lines: string[] = []
  
  const trimmedTitle = title.trim()
  if (trimmedTitle) {
    lines.push(`<div><strong>${escapeHtml(trimmedTitle)}</strong></div>`)
  }
  
  const trimmedDesc = description.trim()
  if (trimmedDesc && trimmedDesc !== trimmedTitle) {
    if (lines.length > 0) lines.push('<div>&nbsp;</div>')
    for (const part of trimmedDesc.split('\n')) {
      if (!part.trim()) {
        lines.push('<div>&nbsp;</div>')
      } else {
        lines.push(`<div>${escapeHtml(part)}</div>`)
      }
    }
  }
  
  const body = lines.join('')
  return `<html><body><!--StartFragment-->${body}<!--EndFragment--></body></html>`
}
