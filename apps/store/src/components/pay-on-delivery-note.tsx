export function PayOnDeliveryNote({ className = '' }: { className?: string }) {
  return (
    <aside
      className={`relative overflow-hidden rounded-r-md border-l-[3px] border-[color:var(--spine)] bg-[color:var(--paper-raised)] py-3 pl-4 pr-4 shadow-[var(--shadow-soft)] ${className}`}
    >
      <p className="font-display text-[0.95rem] font-semibold text-[color:var(--spine)]">
        Pagas cuando tengas el libro
      </p>
      <p className="mt-1 text-sm leading-relaxed text-[color:var(--ink-muted)]">
        El vendedor te lleva los libros a casa. El pago se hace al recibirlos, no
        antes.
      </p>
    </aside>
  )
}
