import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildFacebookShareCode,
  buildPostHtml,
  buildPostText,
  buildWhatsAppProductLink,
  buildWhatsAppProductText,
  formatProductPrice,
  normalizePhoneDigits,
  CONTACT_LABEL,
  PRICE_ICON,
} from './share-link.ts'

describe('share-link', () => {
  it('builds FB share code', () => {
    assert.equal(buildFacebookShareCode('4F2K'), 'FB-4F2K')
  })

  it('builds WhatsApp product text with name and code only', () => {
    assert.equal(
      buildWhatsAppProductText('Arroz premium', '4F2K'),
      'Arroz premium (FB-4F2K)',
    )
  })

  it('builds wa.me link with encoded name and code', () => {
    const link = buildWhatsAppProductLink('5355555555', 'Arroz premium', '4F2K')
    assert.equal(
      link,
      `https://wa.me/5355555555?text=${encodeURIComponent('Arroz premium (FB-4F2K)')}`,
    )
  })

  it('strips non-digits from phone', () => {
    assert.equal(normalizePhoneDigits('+53 5555-5555'), '5355555555')
  })

  it('formats price from cents with icon and currency', () => {
    assert.equal(
      formatProductPrice({ amount: 5000, currency: 'usd' }),
      `${PRICE_ICON} 50 USD`,
    )
  })

  it('builds post with clickable wa.me URL after contact', () => {
    const link = buildWhatsAppProductLink('5355555555', 'Arroz premium', '4F2K')
    const text = buildPostText(
      'Arroz premium',
      'Arroz de calidad',
      '5355555555',
      '4F2K',
      { amount: 5000, currency: 'usd' },
    )
    assert.equal(
      text,
      [
        'Arroz premium',
        `${PRICE_ICON} 50 USD`,
        '',
        CONTACT_LABEL,
        link,
        '',
        'Arroz de calidad',
      ].join('\n'),
    )
  })

  it('builds html with matching wa.me anchor href and text', () => {
    const href = buildWhatsAppProductLink('5355555555', 'Arroz premium', '4F2K')
    const html = buildPostHtml(
      'Arroz premium',
      'Arroz de calidad',
      '5355555555',
      '4F2K',
      { amount: 5000, currency: 'usd' },
    )
    assert.ok(html.includes(`<a href="${href}">${href}</a>`))
    assert.ok(html.includes(`<strong>${CONTACT_LABEL}</strong>`))
  })
})
