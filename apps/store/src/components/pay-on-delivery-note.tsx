import type { CSSProperties, ReactNode } from 'react'

export function PayOnDeliveryNote({
  className = '',
  style,
  children = 'Pagas al recibir tu pedido. Hoy no se cobra nada.',
}: {
  className?: string
  style?: CSSProperties
  children?: ReactNode
}) {
  return (
    <div className={`store-note ${className}`.trim()} style={style}>
      {children}
    </div>
  )
}
