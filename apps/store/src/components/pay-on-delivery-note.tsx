export function PayOnDeliveryNote({ className = '' }: { className?: string }) {
  return (
    <aside
      className={`rounded-md border border-[color:var(--gilt)]/40 bg-[color:var(--gilt-soft)]/25 px-4 py-3 text-sm leading-relaxed text-[color:var(--ink)] ${className}`}
    >
      <p className="font-display text-base font-semibold text-[color:var(--spine)]">
        Pagas cuando tengas el libro
      </p>
      <p className="mt-1 text-[color:var(--ink-muted)]">
        El vendedor te lleva los libros a casa. El pago se hace al recibirlos, no
        antes.
      </p>
    </aside>
  )
}
