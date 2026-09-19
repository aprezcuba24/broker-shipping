import {
  formatSavedContact,
  type MockCustomer,
} from '../mock-customer'

type Props = {
  customer: MockCustomer
  suggestOpenContactInfo?: boolean
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

export function CustomerCard({
  customer,
  suggestOpenContactInfo = false,
}: Props) {
  const saved = formatSavedContact(customer.isSavedContact)
  const badgeClass =
    customer.kind === 'group'
      ? 'badge badge-group'
      : customer.kind === 'business'
        ? 'badge badge-business'
        : 'badge'

  return (
    <article className="card">
      <div className="card-title">
        <h2>{customer.name}</h2>
        <span className={badgeClass}>{customer.kindLabel}</span>
      </div>

      {customer.isVerified ? (
        <p className="meta-chip">Cuenta verificada</p>
      ) : null}

      <dl className="field-list">
        <Row label="Teléfono" value={customer.phone} />
        {suggestOpenContactInfo ? (
          <p className="hint">
            Para obtener el teléfono, haz clic en el nombre del contacto en
            WhatsApp y abre <strong>Datos del contacto</strong>. El número se
            rellenará aquí automáticamente.
          </p>
        ) : null}

        <Row label="Tipo" value={customer.kindLabel} />
        {customer.isBusiness ? (
          <Row label="Empresa" value="Sí" />
        ) : null}
        {saved ? <Row label="En agenda" value={saved} /> : null}
        {customer.presence ? (
          <Row label="Presencia" value={customer.presence} />
        ) : null}
        {customer.about ? <Row label="Info / estado" value={customer.about} /> : null}
        {customer.email ? <Row label="Email" value={customer.email} /> : null}
        {customer.website ? (
          <Row label="Sitio web" value={customer.website} />
        ) : null}
        {customer.participantCount != null ? (
          <Row
            label="Participantes"
            value={String(customer.participantCount)}
          />
        ) : null}
      </dl>

      <div className="crm-block">
        <p className="crm-title">Demo CRM (ficticio)</p>
        <dl className="field-list">
          <Row label="Estado" value={customer.crmStatus} />
          <Row label="Compras" value={customer.purchases} />
          <Row label="Último pedido" value={customer.lastOrder} />
        </dl>
      </div>

      <p className="footer-note">
        Datos de WhatsApp leídos del DOM cuando están visibles. El bloque CRM
        es solo demostración.
      </p>
    </article>
  )
}
