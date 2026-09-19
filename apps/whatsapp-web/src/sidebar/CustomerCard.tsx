import type { MockCustomer } from '../mock-customer'

type Props = {
  customer: MockCustomer
  /** Suggest opening WA contact info when phone is still pending. */
  suggestOpenContactInfo?: boolean
}

export function CustomerCard({
  customer,
  suggestOpenContactInfo = false,
}: Props) {
  return (
    <article className="card">
      <div className="card-title">
        <h2>{customer.name}</h2>
        <span className="badge">{customer.status}</span>
      </div>
      <dl>
        <div className="row">
          <dt>Teléfono</dt>
          <dd>{customer.phone}</dd>
        </div>
        {suggestOpenContactInfo ? (
          <p className="hint">
            Para obtener el teléfono, haz clic en el nombre del contacto en
            WhatsApp y abre <strong>Datos del contacto</strong>. El número se
            rellenará aquí automáticamente.
          </p>
        ) : null}
        <div className="row" style={{ marginTop: 12 }}>
          <dt>Estado</dt>
          <dd>{customer.status}</dd>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <dt>Compras</dt>
          <dd>{customer.purchases}</dd>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <dt>Último pedido</dt>
          <dd>{customer.lastOrder}</dd>
        </div>
      </dl>
      <p className="footer-note">
        Datos de demostración (POC). No provienen de un CRM ni de la API de
        WhatsApp.
      </p>
    </article>
  )
}
