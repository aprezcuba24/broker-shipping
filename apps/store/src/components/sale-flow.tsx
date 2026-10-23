const STEPS = [
  'Elige el libro o los libros que quieres comprar.',
  'Registra tu dirección y tu número de teléfono.',
  'Contacta al vendedor por WhatsApp.',
  'El vendedor te lleva los libros a casa.',
  'Pagas cuando recibas los libros.',
] as const

export function SaleFlow({ compact = false }: { compact?: boolean }) {
  return (
    <section
      aria-labelledby="sale-flow-title"
      className={
        compact
          ? 'rounded-md border border-[color:var(--border)] bg-white/50 p-4'
          : 'rounded-md border border-[color:var(--border)] bg-white/55 p-5 shadow-sm'
      }
    >
      <h2
        id="sale-flow-title"
        className="font-display text-xl font-semibold tracking-tight text-[color:var(--spine)]"
      >
        Cómo funciona la compra
      </h2>
      <ol className="mt-4 space-y-3">
        {STEPS.map((step, index) => (
          <li key={step} className="flex gap-3 text-sm leading-relaxed sm:text-base">
            <span
              aria-hidden
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--spine)] font-display text-sm font-semibold text-[color:var(--paper)]"
            >
              {index + 1}
            </span>
            <span className="text-[color:var(--ink)]">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
