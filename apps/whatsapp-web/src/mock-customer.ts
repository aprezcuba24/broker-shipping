export type MockCustomer = {
  name: string
  phone: string
  status: string
  purchases: string
  lastOrder: string
}

/**
 * Fictional CRM-like card. `phone` is already a display string
 * (number, "No disponible", or "No se pudo obtener").
 */
export function buildMockCustomer(name: string, phone: string): MockCustomer {
  return {
    name,
    phone,
    status: 'Cliente',
    purchases: '$350',
    lastOrder: '#1234',
  }
}
