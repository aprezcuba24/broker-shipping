export type MoneyAmount = {
  amount: number
  currency: string
}

export const PRICE_ICON = '💲'
export const CONTACT_LABEL = 'Contactar por Whatsapp'

/** Digits only, for wa.me. */
export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '')
}

/** Build Facebook share code: FB{publicCode}. */
export function buildFacebookShareCode(publicCode: string): string {
  return `FB${publicCode}`
}

/** Product label in the WhatsApp prefill: "Name (FBCODE)". */
export function buildWhatsAppProductText(
  productName: string,
  publicCode: string,
): string {
  return `${productName} (${buildFacebookShareCode(publicCode)})`
}

/** WhatsApp deep link with product name and FB share code. */
export function buildWhatsAppProductLink(
  phone: string,
  productName: string,
  publicCode: string,
): string {
  const digits = normalizePhoneDigits(phone)
  const text = buildWhatsAppProductText(productName, publicCode)
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

/** Display price from cents, e.g. "💲 50 USD". Prefer sale_price when present. */
export function formatProductPrice(
  price: MoneyAmount | null | undefined,
  salePrice?: MoneyAmount | null,
): string | null {
  const money = salePrice ?? price
  if (!money || typeof money.amount !== 'number' || !money.currency) return null
  const value = money.amount / 100
  const display = Number.isInteger(value)
    ? String(value)
    : (Math.round(value * 100) / 100).toFixed(2)
  return `${PRICE_ICON} ${display} ${money.currency.toUpperCase()}`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

type PostLine = {
  text: string
  bold?: boolean
  /** When set, render as <a>; text must equal href for Facebook to keep it. */
  href?: string
}

/**
 * Name
 * Precio
 * <blank>
 * Contactar por Whatsapp
 * https://wa.me/...?text=Name%20(FBCODE)   ← same string as href (clickable)
 * <blank>
 * Description
 */
export function buildPostLines(
  productName: string,
  description: string | null | undefined,
  phone: string,
  publicCode: string,
  price?: MoneyAmount | null,
  salePrice?: MoneyAmount | null,
): PostLine[] {
  const name = productName.trim()
  const priceLine = formatProductPrice(price, salePrice)
  const desc = description?.trim()
  // Facebook removes "masked" links (phone digits → wa.me). The only reliable
  // clickable form is when visible text === href === full wa.me URL.
  const href = buildWhatsAppProductLink(phone, productName, publicCode)

  const lines: PostLine[] = [{ text: name }]
  if (priceLine) lines.push({ text: priceLine, bold: true })

  lines.push({ text: '' })
  lines.push({ text: CONTACT_LABEL, bold: true })
  lines.push({ text: href, href })

  if (desc && desc !== name) {
    lines.push({ text: '' })
    for (const part of desc.split('\n')) {
      lines.push({ text: part })
    }
  }

  return lines
}

export function buildPostText(
  productName: string,
  description: string | null | undefined,
  phone: string,
  publicCode: string,
  price?: MoneyAmount | null,
  salePrice?: MoneyAmount | null,
): string {
  return buildPostLines(
    productName,
    description,
    phone,
    publicCode,
    price,
    salePrice,
  )
    .map((line) => line.text)
    .join('\n')
}

/**
 * Rich HTML: wa.me URL as both href and link text so Facebook keeps it clickable.
 * Prefill text is Name (FBCODE).
 */
export function buildPostHtml(
  productName: string,
  description: string | null | undefined,
  phone: string,
  publicCode: string,
  price?: MoneyAmount | null,
  salePrice?: MoneyAmount | null,
): string {
  const lines = buildPostLines(
    productName,
    description,
    phone,
    publicCode,
    price,
    salePrice,
  )

  const body = lines
    .map((line) => {
      if (!line.text) {
        return '<div>&nbsp;</div>'
      }
      if (line.href) {
        const url = escapeHtml(line.href)
        return `<div><a href="${url}">${url}</a></div>`
      }
      const inner = line.bold
        ? `<strong>${escapeHtml(line.text)}</strong>`
        : escapeHtml(line.text)
      return `<div>${inner}</div>`
    })
    .join('')

  return `<html><body><!--StartFragment-->${body}<!--EndFragment--></body></html>`
}
