const STEPS = [
  'Elige el libro o los libros que quieres comprar.',
  'Registra tu dirección y tu número de teléfono.',
  'Contacta al vendedor por WhatsApp.',
  'El vendedor te lleva los libros a casa.',
  'Pagas cuando recibas los libros.',
] as const

export function SaleFlow({ compact = false }: { compact?: boolean }) {
  return (
    <section aria-labelledby="sale-flow-title">
      <h2
        id="sale-flow-title"
        className={
          compact
            ? 'font-display text-base font-semibold tracking-tight text-[color:var(--ink)]'
            : 'font-display text-lg font-semibold tracking-tight text-[color:var(--ink)] sm:text-xl'
        }
      >
        Cómo funciona la compra
      </h2>

      {/* Mobile: vertical spine index */}
      <ol
        className={
          compact
            ? 'mt-4 space-y-0 md:hidden'
            : 'mt-5 space-y-0 md:hidden'
        }
      >
        {STEPS.map((step, index) => (
          <li key={step} className="relative flex gap-4 pb-5 last:pb-0">
            {index < STEPS.length - 1 ? (
              <span
                aria-hidden
                className="absolute left-[11px] top-7 bottom-0 w-px bg-[color:var(--gilt)]/40"
              />
            ) : null}
            <span
              aria-hidden
              className="relative z-[1] flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--spine)] font-display text-[0.7rem] font-semibold text-[color:var(--paper-raised)]"
            >
              {index + 1}
            </span>
            <span
              className={
                compact
                  ? 'pt-0.5 text-sm leading-relaxed text-[color:var(--ink-secondary)]'
                  : 'pt-0.5 text-sm leading-relaxed text-[color:var(--ink-secondary)] sm:text-[0.95rem]'
              }
            >
              {step}
            </span>
          </li>
        ))}
      </ol>

      {/* Desktop: horizontal chapter index with gilt rule */}
      <ol
        className={
          compact
            ? 'mt-5 hidden gap-0 md:grid md:grid-cols-5'
            : 'mt-6 hidden gap-0 md:grid md:grid-cols-5'
        }
      >
        {STEPS.map((step, index) => (
          <li key={step} className="relative px-3 first:pl-0 last:pr-0">
            {index < STEPS.length - 1 ? (
              <span
                aria-hidden
                className="absolute left-[calc(50%+1.1rem)] right-[-0.25rem] top-[11px] h-px bg-[color:var(--gilt)]/45"
              />
            ) : null}
            <div className="relative flex flex-col gap-2.5">
              <span
                aria-hidden
                className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--spine)] font-display text-[0.7rem] font-semibold text-[color:var(--paper-raised)]"
              >
                {index + 1}
              </span>
              <span
                className={
                  compact
                    ? 'text-[0.8rem] leading-snug text-[color:var(--ink-secondary)]'
                    : 'text-sm leading-snug text-[color:var(--ink-secondary)]'
                }
              >
                {step}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
