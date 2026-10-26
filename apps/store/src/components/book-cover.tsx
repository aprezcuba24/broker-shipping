type BookCoverProps = {
  title: string
  imageUrl?: string | null
  className?: string
}

export function BookCover({ title, imageUrl, className = '' }: BookCoverProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={title}
        className={`aspect-[2/3] w-full object-cover ${className}`}
      />
    )
  }

  return (
    <div
      className={`book-cover flex aspect-[2/3] w-full flex-col justify-between p-4 text-[color:var(--paper-raised)] ${className}`}
      aria-hidden
    >
      <div className="h-px w-8 bg-[color:var(--gilt-soft)]/80" />
      <p className="font-display text-sm font-semibold leading-snug sm:text-[0.95rem]">
        {title}
      </p>
      <div className="h-px w-12 bg-[color:var(--gilt-soft)]/60" />
    </div>
  )
}
