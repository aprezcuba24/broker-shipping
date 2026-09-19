export type MockCustomer = {
  name: string
  phone: string
  status: string
  purchases: string
  lastOrder: string
}

/**
 * Fictional CRM-like card derived only from the detected display name.
 * No backend — hard-coded demo values for the POC.
 */
export function buildMockCustomer(
  name: string,
  phoneFromHeader: string | null,
): MockCustomer {
  return {
    name,
    phone: phoneFromHeader ?? 'No disponible',
    status: 'Cliente',
    purchases: '$350',
    lastOrder: '#1234',
  }
}
